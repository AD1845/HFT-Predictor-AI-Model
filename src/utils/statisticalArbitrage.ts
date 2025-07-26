export interface StatArbitragePair {
  symbol1: string;
  symbol2: string;
  hedge_ratio: number;
  correlation: number;
  cointegration_pvalue: number;
}

export interface StatArbSignal {
  pair: StatArbitragePair;
  spread: number;
  zscore: number;
  signal: 'LONG' | 'SHORT' | 'NEUTRAL';
  confidence: number;
  entry_threshold: number;
  exit_threshold: number;
}

export interface BollingerBandsSignal {
  symbol: string;
  price: number;
  upper_band: number;
  lower_band: number;
  middle_band: number;
  position: number; // -1 to 1, where position relative to bands
  signal: 'OVERSOLD' | 'OVERBOUGHT' | 'NEUTRAL';
  confidence: number;
}

export class StatisticalArbitrageEngine {
  private priceHistory: Map<string, number[]> = new Map();
  private spreadHistory: Map<string, number[]> = new Map();
  private correlationWindow = 100;
  private zscore_window = 20;
  
  // Predefined pairs with historical relationships
  private tradingPairs: StatArbitragePair[] = [
    { symbol1: 'AAPL', symbol2: 'MSFT', hedge_ratio: 1.2, correlation: 0.85, cointegration_pvalue: 0.01 },
    { symbol1: 'JPM', symbol2: 'BAC', hedge_ratio: 1.8, correlation: 0.75, cointegration_pvalue: 0.03 },
    { symbol1: 'XOM', symbol2: 'CVX', hedge_ratio: 1.1, correlation: 0.92, cointegration_pvalue: 0.005 },
    { symbol1: 'GOOGL', symbol2: 'META', hedge_ratio: 0.8, correlation: 0.7, cointegration_pvalue: 0.02 }
  ];
  
  updatePrices(symbol: string, price: number): void {
    if (!this.priceHistory.has(symbol)) {
      this.priceHistory.set(symbol, []);
    }
    
    const history = this.priceHistory.get(symbol)!;
    history.push(price);
    
    if (history.length > 1000) {
      history.shift();
    }
  }
  
  generateStatArbSignals(marketData: Map<string, number>): StatArbSignal[] {
    const signals: StatArbSignal[] = [];
    
    for (const pair of this.tradingPairs) {
      const price1 = marketData.get(pair.symbol1);
      const price2 = marketData.get(pair.symbol2);
      
      if (!price1 || !price2) continue;
      
      // Update price histories
      this.updatePrices(pair.symbol1, price1);
      this.updatePrices(pair.symbol2, price2);
      
      // Calculate spread
      const spread = price1 - (pair.hedge_ratio * price2);
      const pairKey = `${pair.symbol1}_${pair.symbol2}`;
      
      if (!this.spreadHistory.has(pairKey)) {
        this.spreadHistory.set(pairKey, []);
      }
      
      const spreadHist = this.spreadHistory.get(pairKey)!;
      spreadHist.push(spread);
      
      if (spreadHist.length > 200) spreadHist.shift();
      if (spreadHist.length < this.zscore_window) continue;
      
      // Calculate Z-score
      const recentSpreads = spreadHist.slice(-this.zscore_window);
      const mean = recentSpreads.reduce((sum, val) => sum + val, 0) / recentSpreads.length;
      const variance = recentSpreads.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / recentSpreads.length;
      const stdDev = Math.sqrt(variance);
      const zscore = (spread - mean) / (stdDev + 0.0001);
      
      // Generate signal
      let signal: 'LONG' | 'SHORT' | 'NEUTRAL' = 'NEUTRAL';
      let confidence = 0;
      const entry_threshold = 2.0;
      const exit_threshold = 0.5;
      
      if (zscore > entry_threshold) {
        signal = 'SHORT'; // Spread too high, short symbol1, long symbol2
        confidence = Math.min(Math.abs(zscore) / 3, 0.95);
      } else if (zscore < -entry_threshold) {
        signal = 'LONG'; // Spread too low, long symbol1, short symbol2
        confidence = Math.min(Math.abs(zscore) / 3, 0.95);
      }
      
      signals.push({
        pair,
        spread,
        zscore,
        signal,
        confidence,
        entry_threshold,
        exit_threshold
      });
    }
    
    return signals;
  }
  
  calculateBollingerBands(symbol: string, period: number = 20, stdDevs: number = 2): BollingerBandsSignal | null {
    const history = this.priceHistory.get(symbol);
    if (!history || history.length < period) return null;
    
    const recentPrices = history.slice(-period);
    const currentPrice = history[history.length - 1];
    
    // Calculate moving average
    const sma = recentPrices.reduce((sum, price) => sum + price, 0) / period;
    
    // Calculate standard deviation
    const variance = recentPrices.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
    const stdDev = Math.sqrt(variance);
    
    // Calculate bands
    const upper_band = sma + (stdDevs * stdDev);
    const lower_band = sma - (stdDevs * stdDev);
    
    // Calculate position within bands (-1 to 1)
    const position = (currentPrice - sma) / (stdDevs * stdDev);
    
    // Generate signal
    let signal: 'OVERSOLD' | 'OVERBOUGHT' | 'NEUTRAL' = 'NEUTRAL';
    let confidence = 0;
    
    if (currentPrice <= lower_band) {
      signal = 'OVERSOLD';
      confidence = Math.min(Math.abs(position), 0.95);
    } else if (currentPrice >= upper_band) {
      signal = 'OVERBOUGHT';
      confidence = Math.min(Math.abs(position), 0.95);
    }
    
    return {
      symbol,
      price: currentPrice,
      upper_band,
      lower_band,
      middle_band: sma,
      position,
      signal,
      confidence
    };
  }
  
  calculateMeanReversion(symbol: string, lookback: number = 50): number {
    const history = this.priceHistory.get(symbol);
    if (!history || history.length < lookback) return 0;
    
    const recentPrices = history.slice(-lookback);
    const currentPrice = history[history.length - 1];
    
    // Calculate mean
    const mean = recentPrices.reduce((sum, price) => sum + price, 0) / lookback;
    
    // Calculate mean reversion signal
    const deviation = (currentPrice - mean) / mean;
    
    // Return normalized signal (-1 to 1)
    return Math.tanh(deviation * 5);
  }
  
  detectCointegration(symbol1: string, symbol2: string, window: number = 100): number {
    const hist1 = this.priceHistory.get(symbol1);
    const hist2 = this.priceHistory.get(symbol2);
    
    if (!hist1 || !hist2 || hist1.length < window || hist2.length < window) {
      return 0;
    }
    
    const prices1 = hist1.slice(-window);
    const prices2 = hist2.slice(-window);
    
    // Calculate correlation
    const n = prices1.length;
    const sum1 = prices1.reduce((sum, p) => sum + p, 0);
    const sum2 = prices2.reduce((sum, p) => sum + p, 0);
    const sum1Sq = prices1.reduce((sum, p) => sum + p * p, 0);
    const sum2Sq = prices2.reduce((sum, p) => sum + p * p, 0);
    const sum1Sum2 = prices1.reduce((sum, p, i) => sum + p * prices2[i], 0);
    
    const numerator = n * sum1Sum2 - sum1 * sum2;
    const denominator = Math.sqrt((n * sum1Sq - sum1 * sum1) * (n * sum2Sq - sum2 * sum2));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }
  
  calculateOptimalHedgeRatio(symbol1: string, symbol2: string, window: number = 100): number {
    const hist1 = this.priceHistory.get(symbol1);
    const hist2 = this.priceHistory.get(symbol2);
    
    if (!hist1 || !hist2 || hist1.length < window || hist2.length < window) {
      return 1;
    }
    
    const prices1 = hist1.slice(-window);
    const prices2 = hist2.slice(-window);
    
    // Simple linear regression to find optimal hedge ratio
    const n = prices1.length;
    const sum1 = prices1.reduce((sum, p) => sum + p, 0);
    const sum2 = prices2.reduce((sum, p) => sum + p, 0);
    const sum1Sum2 = prices1.reduce((sum, p, i) => sum + p * prices2[i], 0);
    const sum2Sq = prices2.reduce((sum, p) => sum + p * p, 0);
    
    const numerator = n * sum1Sum2 - sum1 * sum2;
    const denominator = n * sum2Sq - sum2 * sum2;
    
    return denominator === 0 ? 1 : numerator / denominator;
  }
}