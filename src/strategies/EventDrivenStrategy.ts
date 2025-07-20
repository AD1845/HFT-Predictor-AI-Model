import { TradingStrategy, TradeSignal, MarketData, NewsItem, RiskControls } from '../types/strategy';

interface EventType {
  type: string;
  keywords: string[];
  expectedMove: number; // Expected price move as percentage
  timeHorizon: number; // Time horizon in minutes
  confidenceMultiplier: number;
}

export class EventDrivenStrategy extends TradingStrategy {
  private eventTypes: EventType[];
  private sentimentWeight: number;
  private volumeSpikeThreshold: number;

  constructor(riskControls: RiskControls) {
    super('event-driven', 'Event-Driven Trading', riskControls);
    this.sentimentWeight = 0.4;
    this.volumeSpikeThreshold = 2.0; // 2x normal volume
    
    this.eventTypes = [
      {
        type: 'earnings',
        keywords: ['earnings', 'quarterly results', 'eps', 'revenue beat', 'guidance'],
        expectedMove: 0.05, // 5% expected move
        timeHorizon: 60,
        confidenceMultiplier: 1.2
      },
      {
        type: 'merger',
        keywords: ['merger', 'acquisition', 'buyout', 'takeover', 'deal'],
        expectedMove: 0.15, // 15% expected move
        timeHorizon: 240,
        confidenceMultiplier: 1.5
      },
      {
        type: 'product_launch',
        keywords: ['product launch', 'new product', 'innovation', 'breakthrough'],
        expectedMove: 0.03, // 3% expected move
        timeHorizon: 120,
        confidenceMultiplier: 1.0
      },
      {
        type: 'regulatory',
        keywords: ['fda approval', 'regulation', 'compliance', 'investigation', 'lawsuit'],
        expectedMove: 0.08, // 8% expected move
        timeHorizon: 180,
        confidenceMultiplier: 1.3
      },
      {
        type: 'management',
        keywords: ['ceo', 'management change', 'resignation', 'appointment', 'leadership'],
        expectedMove: 0.04, // 4% expected move
        timeHorizon: 90,
        confidenceMultiplier: 1.1
      }
    ];
  }

  async generateSignal(marketData: MarketData[], news: NewsItem[] = []): Promise<TradeSignal[]> {
    const signals: TradeSignal[] = [];
    const startTime = Date.now();

    try {
      // Create symbol-to-data mapping
      const dataMap = new Map<string, MarketData>();
      marketData.forEach(data => dataMap.set(data.symbol, data));

      // Analyze each news item
      for (const newsItem of news) {
        const eventAnalysis = this.analyzeEvent(newsItem);
        
        if (eventAnalysis.significance > 0.3) {
          for (const symbol of newsItem.symbols) {
            const marketData = dataMap.get(symbol);
            if (!marketData) continue;

            const volumeSpike = this.detectVolumeSpike(marketData);
            const priceAction = this.analyzePriceAction(marketData);
            
            // Calculate confidence based on multiple factors
            let confidence = eventAnalysis.significance;
            confidence *= this.sentimentWeight * this.getSentimentMultiplier(newsItem.sentiment);
            confidence *= (1 + Math.min(volumeSpike, 1)); // Volume confirmation
            confidence *= (1 + Math.abs(priceAction) * 0.5); // Price action confirmation

            // Determine action based on sentiment and event type
            let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
            
            if (newsItem.sentiment === 'positive' && confidence > 0.4) {
              action = 'BUY';
            } else if (newsItem.sentiment === 'negative' && confidence > 0.4) {
              action = 'SELL';
            }

            if (action !== 'HOLD') {
              signals.push({
                symbol,
                action,
                confidence: Math.min(confidence, 0.95),
                quantity: this.calculateEventPositionSize(confidence, eventAnalysis.expectedMove),
                stopLoss: this.riskControls.stopLoss,
                takeProfit: Math.min(this.riskControls.takeProfit, eventAnalysis.expectedMove * 100),
                reason: `Event-driven: ${eventAnalysis.eventType} - ${newsItem.title.substring(0, 100)}...`,
                timestamp: new Date().toISOString()
              });
            }
          }
        }
      }

      const latency = Date.now() - startTime;
      if (signals.length > 0) {
        this.updatePerformance(0, latency);
      }

    } catch (error) {
      console.error('Event-Driven Strategy error:', error);
    }

    return signals;
  }

  private analyzeEvent(newsItem: NewsItem): { eventType: string; significance: number; expectedMove: number } {
    let bestMatch: EventType | null = null;
    let maxScore = 0;

    // Find the best matching event type
    for (const eventType of this.eventTypes) {
      let score = 0;
      const content = (newsItem.title + ' ' + newsItem.description).toLowerCase();
      
      for (const keyword of eventType.keywords) {
        if (content.includes(keyword.toLowerCase())) {
          score += 1;
        }
      }
      
      // Normalize score by number of keywords
      score = score / eventType.keywords.length;
      
      if (score > maxScore) {
        maxScore = score;
        bestMatch = eventType;
      }
    }

    if (!bestMatch) {
      return { eventType: 'unknown', significance: 0, expectedMove: 0 };
    }

    // Calculate significance based on impact level and recency
    let significance = maxScore * bestMatch.confidenceMultiplier;
    
    // Adjust for impact level
    const impactMultiplier = newsItem.impact === 'high' ? 1.5 : newsItem.impact === 'medium' ? 1.0 : 0.7;
    significance *= impactMultiplier;

    // Adjust for recency (news loses impact over time)
    const hoursOld = (Date.now() - new Date(newsItem.publishedAt).getTime()) / (1000 * 60 * 60);
    const recencyFactor = Math.max(0.1, 1 - (hoursOld / 24)); // Decay over 24 hours
    significance *= recencyFactor;

    return {
      eventType: bestMatch.type,
      significance: Math.min(significance, 1.0),
      expectedMove: bestMatch.expectedMove * significance
    };
  }

  private detectVolumeSpike(data: MarketData): number {
    // Simulate volume spike detection
    // In production, this would compare current volume to historical average
    const normalVolume = data.volume * 0.7; // Assume current is 1.4x normal
    return Math.max(0, (data.volume - normalVolume) / normalVolume);
  }

  private analyzePriceAction(data: MarketData): number {
    // Analyze recent price action
    // Positive value indicates upward momentum, negative indicates downward
    return data.changePercent;
  }

  private getSentimentMultiplier(sentiment: string): number {
    switch (sentiment) {
      case 'positive': return 1.2;
      case 'negative': return 1.2;
      case 'neutral': return 0.8;
      default: return 1.0;
    }
  }

  private calculateEventPositionSize(confidence: number, expectedMove: number): number {
    // Position size based on confidence and expected move
    const baseSize = this.riskControls.maxPositionSize / 100;
    const moveAdjustment = Math.min(expectedMove * 10, 2); // Cap adjustment at 2x
    return baseSize * confidence * moveAdjustment;
  }

  // Method to add custom event types
  addEventType(eventType: EventType): void {
    this.eventTypes.push(eventType);
  }

  // Method to update sensitivity parameters
  updateParameters(sentimentWeight: number, volumeThreshold: number): void {
    this.sentimentWeight = Math.max(0, Math.min(1, sentimentWeight));
    this.volumeSpikeThreshold = Math.max(1, volumeThreshold);
  }
}