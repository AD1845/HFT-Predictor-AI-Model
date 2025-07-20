import { TradingStrategy, TradeSignal, MarketData, RiskControls } from '../types/strategy';

interface ValuationMetrics {
  peRatio?: number;
  pbRatio?: number;
  psRatio?: number;
  evEbitda?: number;
  roe?: number;
  roa?: number;
  debtToEquity?: number;
  currentRatio?: number;
  grossMargin?: number;
}

export class LongShortEquityStrategy extends TradingStrategy {
  private sectorBenchmarks: Map<string, ValuationMetrics>;
  private overvaluedThreshold: number;
  private undervaluedThreshold: number;

  constructor(riskControls: RiskControls) {
    super('long-short-equity', 'Long/Short Equity', riskControls);
    this.overvaluedThreshold = 1.3; // 30% above sector average
    this.undervaluedThreshold = 0.7; // 30% below sector average
    
    // Initialize sector benchmarks (in production, this would come from financial data API)
    this.sectorBenchmarks = new Map([
      ['Technology', { peRatio: 25, pbRatio: 3.5, psRatio: 6, evEbitda: 18, roe: 0.20 }],
      ['Financial', { peRatio: 12, pbRatio: 1.2, psRatio: 2.5, evEbitda: 8, roe: 0.12 }],
      ['Healthcare', { peRatio: 22, pbRatio: 3.0, psRatio: 4.5, evEbitda: 15, roe: 0.15 }],
      ['Energy', { peRatio: 15, pbRatio: 1.8, psRatio: 1.5, evEbitda: 6, roe: 0.08 }],
      ['Consumer', { peRatio: 18, pbRatio: 2.5, psRatio: 3.0, evEbitda: 12, roe: 0.14 }]
    ]);
  }

  async generateSignal(marketData: MarketData[]): Promise<TradeSignal[]> {
    const signals: TradeSignal[] = [];
    const startTime = Date.now();

    try {
      for (const data of marketData) {
        const valuation = this.getValuationMetrics(data.symbol);
        const sector = this.getSector(data.symbol);
        const benchmark = this.sectorBenchmarks.get(sector);

        if (!valuation || !benchmark) continue;

        const valuationScore = this.calculateValuationScore(valuation, benchmark);
        const technicalScore = this.calculateTechnicalScore(data);
        const combinedScore = (valuationScore * 0.7) + (technicalScore * 0.3);

        let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
        let confidence = 0;
        let reason = '';

        if (combinedScore < this.undervaluedThreshold) {
          action = 'BUY';
          confidence = Math.min(0.95, (this.undervaluedThreshold - combinedScore) * 2);
          reason = `Undervalued: Combined score ${combinedScore.toFixed(2)} (valuation: ${valuationScore.toFixed(2)}, technical: ${technicalScore.toFixed(2)})`;
        } else if (combinedScore > this.overvaluedThreshold) {
          action = 'SELL';
          confidence = Math.min(0.95, (combinedScore - this.overvaluedThreshold) * 2);
          reason = `Overvalued: Combined score ${combinedScore.toFixed(2)} (valuation: ${valuationScore.toFixed(2)}, technical: ${technicalScore.toFixed(2)})`;
        }

        if (action !== 'HOLD' && confidence > 0.3) {
          signals.push({
            symbol: data.symbol,
            action,
            confidence,
            quantity: this.calculatePositionSize(confidence),
            stopLoss: this.riskControls.stopLoss,
            takeProfit: this.riskControls.takeProfit,
            reason,
            timestamp: new Date().toISOString()
          });
        }
      }

      const latency = Date.now() - startTime;
      if (signals.length > 0) {
        this.updatePerformance(0, latency);
      }

    } catch (error) {
      console.error('Long/Short Equity Strategy error:', error);
    }

    return signals;
  }

  private calculateValuationScore(metrics: ValuationMetrics, benchmark: ValuationMetrics): number {
    let score = 0;
    let count = 0;

    // PE Ratio analysis
    if (metrics.peRatio && benchmark.peRatio) {
      score += metrics.peRatio / benchmark.peRatio;
      count++;
    }

    // PB Ratio analysis
    if (metrics.pbRatio && benchmark.pbRatio) {
      score += metrics.pbRatio / benchmark.pbRatio;
      count++;
    }

    // PS Ratio analysis
    if (metrics.psRatio && benchmark.psRatio) {
      score += metrics.psRatio / benchmark.psRatio;
      count++;
    }

    // EV/EBITDA analysis
    if (metrics.evEbitda && benchmark.evEbitda) {
      score += metrics.evEbitda / benchmark.evEbitda;
      count++;
    }

    return count > 0 ? score / count : 1;
  }

  private calculateTechnicalScore(data: MarketData): number {
    // Technical analysis to complement fundamental analysis
    let score = 1; // Neutral

    if (data.indicators) {
      const { rsi, sma20, sma50 } = data.indicators;

      // RSI analysis
      if (rsi) {
        if (rsi < 30) score -= 0.3; // Oversold - bullish
        else if (rsi > 70) score += 0.3; // Overbought - bearish
      }

      // Moving average analysis
      if (sma20 && sma50) {
        if (data.price > sma20 && sma20 > sma50) score -= 0.2; // Uptrend
        else if (data.price < sma20 && sma20 < sma50) score += 0.2; // Downtrend
      }

      // Volume analysis
      if (data.volume > 1000000) { // High volume confirmation
        score *= 1.1;
      }
    }

    return Math.max(0.1, Math.min(2.0, score));
  }

  private calculatePositionSize(confidence: number): number {
    // Position size based on confidence and risk controls
    const baseSize = this.riskControls.maxPositionSize / 100;
    return baseSize * confidence;
  }

  private getValuationMetrics(symbol: string): ValuationMetrics | null {
    // Simulate valuation metrics (in production, this would come from financial data API)
    const mockMetrics: Record<string, ValuationMetrics> = {
      'AAPL': { peRatio: 28, pbRatio: 4.2, psRatio: 7.1, evEbitda: 20, roe: 0.25 },
      'MSFT': { peRatio: 32, pbRatio: 4.8, psRatio: 12.5, evEbitda: 22, roe: 0.28 },
      'GOOGL': { peRatio: 22, pbRatio: 3.1, psRatio: 5.8, evEbitda: 15, roe: 0.18 },
      'META': { peRatio: 18, pbRatio: 2.9, psRatio: 4.2, evEbitda: 12, roe: 0.22 },
      'TSLA': { peRatio: 45, pbRatio: 8.2, psRatio: 12.8, evEbitda: 35, roe: 0.15 },
      'JPM': { peRatio: 11, pbRatio: 1.1, psRatio: 2.2, evEbitda: 7, roe: 0.13 },
      'BAC': { peRatio: 10, pbRatio: 0.9, psRatio: 2.8, evEbitda: 8, roe: 0.11 },
      'JNJ': { peRatio: 16, pbRatio: 2.8, psRatio: 4.1, evEbitda: 13, roe: 0.16 },
      'XOM': { peRatio: 12, pbRatio: 1.5, psRatio: 1.2, evEbitda: 5, roe: 0.09 }
    };

    return mockMetrics[symbol] || null;
  }

  private getSector(symbol: string): string {
    // Simulate sector mapping (in production, this would come from reference data)
    const sectorMap: Record<string, string> = {
      'AAPL': 'Technology', 'MSFT': 'Technology', 'GOOGL': 'Technology', 'META': 'Technology',
      'NVDA': 'Technology', 'TSLA': 'Consumer', 'JPM': 'Financial', 'BAC': 'Financial',
      'WFC': 'Financial', 'GS': 'Financial', 'JNJ': 'Healthcare', 'PFE': 'Healthcare',
      'UNH': 'Healthcare', 'ABBV': 'Healthcare', 'XOM': 'Energy', 'CVX': 'Energy'
    };

    return sectorMap[symbol] || 'Technology';
  }
}