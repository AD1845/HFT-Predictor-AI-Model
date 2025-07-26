export interface AlphaFactor {
  name: string;
  value: number;
  zscore: number;
  percentile: number;
  signal_strength: number;
  decay_factor: number;
}

export interface MicrostructureSignal {
  symbol: string;
  noise_ratio: number;
  momentum_1s: number;
  momentum_5s: number;
  momentum_30s: number;
  volume_momentum: number;
  price_velocity: number;
  acceleration: number;
  microstructure_alpha: number;
}

export class AlphaFactorEngine {
  private priceHistory: Map<string, Array<{price: number, timestamp: number, volume: number}>> = new Map();
  private factorHistory: Map<string, number[]> = new Map();
  private readonly MAX_HISTORY = 1000;
  
  updateMarketData(symbol: string, price: number, volume: number, timestamp: number = Date.now()): void {
    if (!this.priceHistory.has(symbol)) {
      this.priceHistory.set(symbol, []);
    }
    
    const history = this.priceHistory.get(symbol)!;
    history.push({ price, timestamp, volume });
    
    if (history.length > this.MAX_HISTORY) {
      history.shift();
    }
  }
  
  generateMicrostructureSignals(symbol: string): MicrostructureSignal | null {
    const history = this.priceHistory.get(symbol);
    if (!history || history.length < 30) return null;
    
    const currentTime = Date.now();
    const current = history[history.length - 1];
    
    // Calculate noise ratio (price volatility vs fundamental movement)
    const noise_ratio = this.calculateNoiseRatio(history);
    
    // Calculate momentum at different timeframes
    const momentum_1s = this.calculateMomentum(history, 1000); // 1 second
    const momentum_5s = this.calculateMomentum(history, 5000); // 5 seconds
    const momentum_30s = this.calculateMomentum(history, 30000); // 30 seconds
    
    // Volume momentum
    const volume_momentum = this.calculateVolumeMomentum(history);
    
    // Price velocity and acceleration
    const { velocity, acceleration } = this.calculateVelocityAcceleration(history);
    
    // Composite microstructure alpha
    const microstructure_alpha = this.calculateMicrostructureAlpha({
      noise_ratio,
      momentum_1s,
      momentum_5s,
      momentum_30s,
      volume_momentum,
      velocity: velocity,
      acceleration
    });
    
    return {
      symbol,
      noise_ratio,
      momentum_1s,
      momentum_5s,
      momentum_30s,
      volume_momentum,
      price_velocity: velocity,
      acceleration,
      microstructure_alpha
    };
  }
  
  generateAlphaFactors(symbol: string): AlphaFactor[] {
    const history = this.priceHistory.get(symbol);
    if (!history || history.length < 50) return [];
    
    const factors: AlphaFactor[] = [];
    
    // Factor 1: Price Momentum with Volume Confirmation
    const momentumFactor = this.calculateMomentumFactor(history);
    factors.push(this.createAlphaFactor('momentum_volume', momentumFactor, symbol));
    
    // Factor 2: Mean Reversion (contrarian)
    const reversionFactor = this.calculateReversionFactor(history);
    factors.push(this.createAlphaFactor('mean_reversion', reversionFactor, symbol));
    
    // Factor 3: Volume-Price Divergence
    const divergenceFactor = this.calculateDivergenceFactor(history);
    factors.push(this.createAlphaFactor('volume_divergence', divergenceFactor, symbol));
    
    // Factor 4: Volatility Factor
    const volatilityFactor = this.calculateVolatilityFactor(history);
    factors.push(this.createAlphaFactor('volatility', volatilityFactor, symbol));
    
    // Factor 5: Microstructure Noise
    const noiseFactor = this.calculateNoiseFactor(history);
    factors.push(this.createAlphaFactor('microstructure_noise', noiseFactor, symbol));
    
    // Factor 6: Tick-level Momentum
    const tickMomentumFactor = this.calculateTickMomentumFactor(history);
    factors.push(this.createAlphaFactor('tick_momentum', tickMomentumFactor, symbol));
    
    return factors;
  }
  
  private calculateNoiseRatio(history: Array<{price: number, timestamp: number, volume: number}>): number {
    if (history.length < 10) return 0;
    
    const prices = history.slice(-20).map(h => h.price);
    const returns = prices.slice(1).map((p, i) => Math.log(p / prices[i]));
    
    // High-frequency variance vs low-frequency variance
    const totalVariance = this.variance(returns);
    const smoothedPrices = this.exponentialMovingAverage(prices, 0.3);
    const smoothedReturns = smoothedPrices.slice(1).map((p, i) => Math.log(p / smoothedPrices[i]));
    const smoothedVariance = this.variance(smoothedReturns);
    
    return totalVariance / (smoothedVariance + 0.0001);
  }
  
  private calculateMomentum(history: Array<{price: number, timestamp: number, volume: number}>, timeWindowMs: number): number {
    const currentTime = Date.now();
    const cutoffTime = currentTime - timeWindowMs;
    
    const relevantData = history.filter(h => h.timestamp >= cutoffTime);
    if (relevantData.length < 2) return 0;
    
    const startPrice = relevantData[0].price;
    const endPrice = relevantData[relevantData.length - 1].price;
    
    return (endPrice - startPrice) / startPrice;
  }
  
  private calculateVolumeMomentum(history: Array<{price: number, timestamp: number, volume: number}>): number {
    if (history.length < 10) return 0;
    
    const recent = history.slice(-10);
    const recentVolume = recent.reduce((sum, h) => sum + h.volume, 0) / recent.length;
    const historical = history.slice(-50, -10);
    const historicalVolume = historical.reduce((sum, h) => sum + h.volume, 0) / historical.length;
    
    return (recentVolume - historicalVolume) / (historicalVolume + 1);
  }
  
  private calculateVelocityAcceleration(history: Array<{price: number, timestamp: number, volume: number}>): {velocity: number, acceleration: number} {
    if (history.length < 3) return { velocity: 0, acceleration: 0 };
    
    const recent = history.slice(-3);
    const dt1 = (recent[1].timestamp - recent[0].timestamp) / 1000; // seconds
    const dt2 = (recent[2].timestamp - recent[1].timestamp) / 1000;
    
    const v1 = (recent[1].price - recent[0].price) / dt1;
    const v2 = (recent[2].price - recent[1].price) / dt2;
    
    const velocity = v2;
    const acceleration = (v2 - v1) / dt2;
    
    return { velocity, acceleration };
  }
  
  private calculateMicrostructureAlpha(signals: any): number {
    // Composite alpha using weighted combination of microstructure signals
    const weights = {
      noise: -0.2,      // Low noise is good
      momentum_short: 0.3,  // Short-term momentum
      momentum_medium: 0.2, // Medium-term momentum
      momentum_long: 0.1,   // Long-term momentum
      volume: 0.15,     // Volume confirmation
      velocity: 0.25    // Price velocity
    };
    
    const alpha = 
      weights.noise * signals.noise_ratio +
      weights.momentum_short * signals.momentum_1s +
      weights.momentum_medium * signals.momentum_5s +
      weights.momentum_long * signals.momentum_30s +
      weights.volume * signals.volume_momentum +
      weights.velocity * signals.velocity;
    
    return Math.tanh(alpha * 5); // Normalize to [-1, 1]
  }
  
  private calculateMomentumFactor(history: Array<{price: number, timestamp: number, volume: number}>): number {
    if (history.length < 20) return 0;
    
    const prices = history.slice(-20).map(h => h.price);
    const volumes = history.slice(-20).map(h => h.volume);
    
    // Price momentum
    const priceMomentum = (prices[prices.length - 1] - prices[0]) / prices[0];
    
    // Volume-weighted momentum
    const avgVolume = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;
    const recentVolume = volumes.slice(-5).reduce((sum, v) => sum + v, 0) / 5;
    const volumeWeight = Math.min(recentVolume / avgVolume, 3);
    
    return priceMomentum * Math.log(volumeWeight);
  }
  
  private calculateReversionFactor(history: Array<{price: number, timestamp: number, volume: number}>): number {
    if (history.length < 30) return 0;
    
    const prices = history.slice(-30).map(h => h.price);
    const currentPrice = prices[prices.length - 1];
    const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const stdDev = Math.sqrt(this.variance(prices));
    
    const zScore = (currentPrice - mean) / (stdDev + 0.0001);
    
    // Reversion signal is negative of z-score (high prices should revert down)
    return -Math.tanh(zScore);
  }
  
  private calculateDivergenceFactor(history: Array<{price: number, timestamp: number, volume: number}>): number {
    if (history.length < 20) return 0;
    
    const recent = history.slice(-20);
    const prices = recent.map(h => h.price);
    const volumes = recent.map(h => h.volume);
    
    // Price direction
    const priceDirection = prices[prices.length - 1] > prices[0] ? 1 : -1;
    
    // Volume trend
    const firstHalfVolume = volumes.slice(0, 10).reduce((sum, v) => sum + v, 0);
    const secondHalfVolume = volumes.slice(10).reduce((sum, v) => sum + v, 0);
    const volumeDirection = secondHalfVolume > firstHalfVolume ? 1 : -1;
    
    // Divergence when price and volume move in opposite directions
    return priceDirection !== volumeDirection ? Math.abs(priceDirection) : 0;
  }
  
  private calculateVolatilityFactor(history: Array<{price: number, timestamp: number, volume: number}>): number {
    if (history.length < 20) return 0;
    
    const prices = history.slice(-20).map(h => h.price);
    const returns = prices.slice(1).map((p, i) => Math.log(p / prices[i]));
    
    const recentVol = Math.sqrt(this.variance(returns.slice(-10)));
    const historicalVol = Math.sqrt(this.variance(returns.slice(0, -10)));
    
    return (recentVol - historicalVol) / (historicalVol + 0.0001);
  }
  
  private calculateNoiseFactor(history: Array<{price: number, timestamp: number, volume: number}>): number {
    return -this.calculateNoiseRatio(history); // Low noise is good
  }
  
  private calculateTickMomentumFactor(history: Array<{price: number, timestamp: number, volume: number}>): number {
    if (history.length < 10) return 0;
    
    const recent = history.slice(-10);
    let upTicks = 0;
    let downTicks = 0;
    
    for (let i = 1; i < recent.length; i++) {
      if (recent[i].price > recent[i-1].price) upTicks++;
      else if (recent[i].price < recent[i-1].price) downTicks++;
    }
    
    const totalTicks = upTicks + downTicks;
    return totalTicks > 0 ? (upTicks - downTicks) / totalTicks : 0;
  }
  
  private createAlphaFactor(name: string, value: number, symbol: string): AlphaFactor {
    // Update factor history for z-score calculation
    const key = `${symbol}_${name}`;
    if (!this.factorHistory.has(key)) {
      this.factorHistory.set(key, []);
    }
    
    const history = this.factorHistory.get(key)!;
    history.push(value);
    if (history.length > 200) history.shift();
    
    // Calculate z-score and percentile
    const mean = history.reduce((sum, v) => sum + v, 0) / history.length;
    const variance = this.variance(history);
    const zscore = variance > 0 ? (value - mean) / Math.sqrt(variance) : 0;
    
    // Calculate percentile
    const sortedHistory = [...history].sort((a, b) => a - b);
    const rank = sortedHistory.findIndex(v => v >= value);
    const percentile = rank / sortedHistory.length;
    
    return {
      name,
      value,
      zscore,
      percentile,
      signal_strength: Math.tanh(Math.abs(zscore)),
      decay_factor: Math.exp(-0.1) // Exponential decay
    };
  }
  
  private variance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  }
  
  private exponentialMovingAverage(values: number[], alpha: number): number[] {
    if (values.length === 0) return [];
    
    const ema = [values[0]];
    for (let i = 1; i < values.length; i++) {
      ema.push(alpha * values[i] + (1 - alpha) * ema[i - 1]);
    }
    return ema;
  }
}