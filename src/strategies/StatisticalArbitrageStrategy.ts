import { TradingStrategy, TradeSignal, MarketData, RiskControls } from '../types/strategy';

export class StatisticalArbitrageStrategy extends TradingStrategy {
  private correlationPairs: { symbol1: string; symbol2: string; correlation: number }[];
  private lookbackPeriod: number;
  private zScoreThreshold: number;

  constructor(riskControls: RiskControls) {
    super('stat-arb', 'Statistical Arbitrage', riskControls);
    this.correlationPairs = [
      { symbol1: 'AAPL', symbol2: 'MSFT', correlation: 0.85 },
      { symbol1: 'GOOGL', symbol2: 'META', correlation: 0.78 },
      { symbol1: 'JPM', symbol2: 'BAC', correlation: 0.82 },
      { symbol1: 'XOM', symbol2: 'CVX', correlation: 0.76 }
    ];
    this.lookbackPeriod = 20;
    this.zScoreThreshold = 2.0;
  }

  async generateSignal(marketData: MarketData[]): Promise<TradeSignal[]> {
    const signals: TradeSignal[] = [];
    const startTime = Date.now();

    try {
      // Create price map for quick lookup
      const priceMap = new Map<string, MarketData>();
      marketData.forEach(data => priceMap.set(data.symbol, data));

      for (const pair of this.correlationPairs) {
        const data1 = priceMap.get(pair.symbol1);
        const data2 = priceMap.get(pair.symbol2);

        if (!data1 || !data2) continue;

        // Calculate price ratio and z-score
        const ratio = data1.price / data2.price;
        const { mean, std } = this.calculateHistoricalStats(pair.symbol1, pair.symbol2, marketData);
        const zScore = (ratio - mean) / std;

        // Generate signals based on z-score
        if (Math.abs(zScore) > this.zScoreThreshold) {
          const confidence = Math.min(Math.abs(zScore) / 3, 0.95);
          
          if (zScore > this.zScoreThreshold) {
            // Ratio is too high: sell symbol1, buy symbol2
            signals.push({
              symbol: pair.symbol1,
              action: 'SELL',
              confidence,
              stopLoss: this.riskControls.stopLoss,
              takeProfit: this.riskControls.takeProfit,
              reason: `Statistical arbitrage: ${pair.symbol1}/${pair.symbol2} ratio overextended (z-score: ${zScore.toFixed(2)})`,
              timestamp: new Date().toISOString()
            });

            signals.push({
              symbol: pair.symbol2,
              action: 'BUY',
              confidence,
              stopLoss: this.riskControls.stopLoss,
              takeProfit: this.riskControls.takeProfit,
              reason: `Statistical arbitrage: ${pair.symbol1}/${pair.symbol2} ratio overextended (z-score: ${zScore.toFixed(2)})`,
              timestamp: new Date().toISOString()
            });
          } else {
            // Ratio is too low: buy symbol1, sell symbol2
            signals.push({
              symbol: pair.symbol1,
              action: 'BUY',
              confidence,
              stopLoss: this.riskControls.stopLoss,
              takeProfit: this.riskControls.takeProfit,
              reason: `Statistical arbitrage: ${pair.symbol1}/${pair.symbol2} ratio underextended (z-score: ${zScore.toFixed(2)})`,
              timestamp: new Date().toISOString()
            });

            signals.push({
              symbol: pair.symbol2,
              action: 'SELL',
              confidence,
              stopLoss: this.riskControls.stopLoss,
              takeProfit: this.riskControls.takeProfit,
              reason: `Statistical arbitrage: ${pair.symbol1}/${pair.symbol2} ratio underextended (z-score: ${zScore.toFixed(2)})`,
              timestamp: new Date().toISOString()
            });
          }
        }
      }

      const latency = Date.now() - startTime;
      if (signals.length > 0) {
        this.updatePerformance(0, latency); // Performance will be updated when trade executes
      }

    } catch (error) {
      console.error('Statistical Arbitrage Strategy error:', error);
    }

    return signals;
  }

  private calculateHistoricalStats(symbol1: string, symbol2: string, marketData: MarketData[]): { mean: number; std: number } {
    // Simulate historical ratio calculation
    // In production, this would use actual historical data
    const ratios: number[] = [];
    const data1 = marketData.find(d => d.symbol === symbol1);
    const data2 = marketData.find(d => d.symbol === symbol2);
    
    if (!data1 || !data2) return { mean: 1, std: 0.1 };

    const baseRatio = data1.price / data2.price;
    
    // Generate synthetic historical ratios for demo
    for (let i = 0; i < this.lookbackPeriod; i++) {
      const noise = (Math.random() - 0.5) * 0.1;
      ratios.push(baseRatio * (1 + noise));
    }

    const mean = ratios.reduce((sum, ratio) => sum + ratio, 0) / ratios.length;
    const variance = ratios.reduce((sum, ratio) => sum + Math.pow(ratio - mean, 2), 0) / ratios.length;
    const std = Math.sqrt(variance);

    return { mean, std };
  }

  // Method to update correlation pairs based on real-time analysis
  updateCorrelations(newCorrelations: { symbol1: string; symbol2: string; correlation: number }[]): void {
    this.correlationPairs = newCorrelations.filter(pair => pair.correlation > 0.7);
  }
}