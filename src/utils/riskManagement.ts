export interface RiskLimits {
  maxPositionSize: number;
  dailyLossLimit: number;
  maxDrawdown: number;
  concentrationLimit: number; // Max % in single asset
  leverageLimit: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  maxCorrelatedPositions: number;
}

export interface Position {
  symbol: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  timestamp: number;
  stopLoss?: number;
  takeProfit?: number;
}

export interface RiskMetrics {
  portfolioValue: number;
  exposureByAsset: Map<string, number>;
  correlationRisk: number;
  varEstimate: number; // Value at Risk
  sharpeRatio: number;
  maxDrawdown: number;
  currentDrawdown: number;
  dailyPnL: number;
}

export class RiskManager {
  private positions: Map<string, Position> = new Map();
  private dailyPnL: number = 0;
  private portfolioHistory: number[] = [];
  private maxPortfolioValue: number = 0;
  private riskLimits: RiskLimits;
  
  constructor(riskLimits: RiskLimits) {
    this.riskLimits = riskLimits;
  }
  
  // Kelly Criterion position sizing
  calculateKellyPosition(
    winRate: number, 
    avgWin: number, 
    avgLoss: number, 
    portfolioValue: number
  ): number {
    const b = avgWin / Math.abs(avgLoss); // Odds ratio
    const p = winRate; // Win probability
    const q = 1 - p; // Loss probability
    
    const kellyFraction = (b * p - q) / b;
    
    // Apply safety factor and cap at risk limits
    const safetyFactor = 0.25; // Use 25% of Kelly recommendation
    const kellyPosition = kellyFraction * safetyFactor * portfolioValue;
    
    return Math.min(kellyPosition, this.riskLimits.maxPositionSize);
  }
  
  // Volatility-weighted position sizing
  calculateVolatilityWeightedPosition(
    symbol: string,
    volatility: number,
    targetVolatility: number,
    portfolioValue: number
  ): number {
    const volAdjustment = targetVolatility / (volatility + 0.001);
    const basePosition = portfolioValue * 0.02; // 2% base allocation
    
    return Math.min(
      basePosition * volAdjustment,
      this.riskLimits.maxPositionSize
    );
  }
  
  // Risk limit checks
  checkRiskLimits(
    symbol: string, 
    proposedQuantity: number, 
    currentPrice: number
  ): { allowed: boolean; reason?: string } {
    const proposedValue = Math.abs(proposedQuantity * currentPrice);
    
    // Position size limit
    if (proposedValue > this.riskLimits.maxPositionSize) {
      return { 
        allowed: false, 
        reason: `Position size ${proposedValue} exceeds limit ${this.riskLimits.maxPositionSize}` 
      };
    }
    
    // Daily loss limit
    if (this.dailyPnL < -this.riskLimits.dailyLossLimit) {
      return { 
        allowed: false, 
        reason: `Daily loss limit reached: ${this.dailyPnL}` 
      };
    }
    
    // Concentration limit
    const metrics = this.calculateRiskMetrics();
    const portfolioValue = metrics.portfolioValue;
    if (portfolioValue > 0) {
      const newConcentration = proposedValue / portfolioValue;
      if (newConcentration > this.riskLimits.concentrationLimit) {
        return { 
          allowed: false, 
          reason: `Concentration ${newConcentration * 100}% exceeds limit ${this.riskLimits.concentrationLimit * 100}%` 
        };
      }
    }
    
    // Drawdown limit
    if (metrics.currentDrawdown > this.riskLimits.maxDrawdown) {
      return { 
        allowed: false, 
        reason: `Current drawdown ${metrics.currentDrawdown * 100}% exceeds limit ${this.riskLimits.maxDrawdown * 100}%` 
      };
    }
    
    return { allowed: true };
  }
  
  // Position management
  addPosition(position: Position): void {
    this.positions.set(position.symbol, position);
    this.updatePortfolioHistory();
  }
  
  updatePosition(symbol: string, currentPrice: number): void {
    const position = this.positions.get(symbol);
    if (position) {
      position.currentPrice = currentPrice;
      position.unrealizedPnL = (currentPrice - position.entryPrice) * position.quantity;
      
      // Check stop loss and take profit
      this.checkStopLossAndTakeProfit(position);
    }
  }
  
  closePosition(symbol: string, exitPrice: number): number {
    const position = this.positions.get(symbol);
    if (!position) return 0;
    
    const realizedPnL = (exitPrice - position.entryPrice) * position.quantity;
    this.dailyPnL += realizedPnL;
    this.positions.delete(symbol);
    this.updatePortfolioHistory();
    
    return realizedPnL;
  }
  
  private checkStopLossAndTakeProfit(position: Position): void {
    const pnlPercent = position.unrealizedPnL / (position.entryPrice * Math.abs(position.quantity));
    
    // Stop loss check
    if (position.stopLoss && position.currentPrice <= position.stopLoss) {
      console.log(`Stop loss triggered for ${position.symbol} at ${position.currentPrice}`);
      this.closePosition(position.symbol, position.currentPrice);
      return;
    }
    
    // Take profit check
    if (position.takeProfit && position.currentPrice >= position.takeProfit) {
      console.log(`Take profit triggered for ${position.symbol} at ${position.currentPrice}`);
      this.closePosition(position.symbol, position.currentPrice);
      return;
    }
    
    // Dynamic stop loss based on risk limits
    if (pnlPercent < -this.riskLimits.stopLossPercent / 100) {
      console.log(`Dynamic stop loss triggered for ${position.symbol}`);
      this.closePosition(position.symbol, position.currentPrice);
    }
  }
  
  // Risk metrics calculation
  calculateRiskMetrics(): RiskMetrics {
    let portfolioValue = 0;
    const exposureByAsset = new Map<string, number>();
    let totalUnrealizedPnL = 0;
    
    // Calculate current portfolio state
    for (const [symbol, position] of this.positions) {
      const positionValue = Math.abs(position.quantity * position.currentPrice);
      portfolioValue += positionValue;
      exposureByAsset.set(symbol, positionValue);
      totalUnrealizedPnL += position.unrealizedPnL;
    }
    
    // Update max portfolio value for drawdown calculation
    this.maxPortfolioValue = Math.max(this.maxPortfolioValue, portfolioValue);
    
    // Calculate drawdown
    const currentDrawdown = this.maxPortfolioValue > 0 ? 
      (this.maxPortfolioValue - portfolioValue) / this.maxPortfolioValue : 0;
    
    // Calculate VaR (simplified)
    const varEstimate = this.calculateVaR();
    
    // Calculate Sharpe ratio
    const sharpeRatio = this.calculateSharpeRatio();
    
    // Calculate max drawdown from history
    const maxDrawdown = this.calculateMaxDrawdown();
    
    // Calculate correlation risk
    const correlationRisk = this.calculateCorrelationRisk();
    
    return {
      portfolioValue,
      exposureByAsset,
      correlationRisk,
      varEstimate,
      sharpeRatio,
      maxDrawdown,
      currentDrawdown,
      dailyPnL: this.dailyPnL + totalUnrealizedPnL
    };
  }
  
  private calculateVaR(confidenceLevel: number = 0.95): number {
    if (this.portfolioHistory.length < 30) return 0;
    
    const returns = this.portfolioHistory.slice(1).map((value, i) => 
      (value - this.portfolioHistory[i]) / this.portfolioHistory[i]
    );
    
    returns.sort((a, b) => a - b);
    const varIndex = Math.floor((1 - confidenceLevel) * returns.length);
    
    return Math.abs(returns[varIndex] || 0);
  }
  
  private calculateSharpeRatio(): number {
    if (this.portfolioHistory.length < 30) return 0;
    
    const returns = this.portfolioHistory.slice(1).map((value, i) => 
      (value - this.portfolioHistory[i]) / this.portfolioHistory[i]
    );
    
    const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance);
    
    return volatility > 0 ? meanReturn / volatility : 0;
  }
  
  private calculateMaxDrawdown(): number {
    if (this.portfolioHistory.length < 2) return 0;
    
    let maxDrawdown = 0;
    let peak = this.portfolioHistory[0];
    
    for (const value of this.portfolioHistory) {
      if (value > peak) {
        peak = value;
      } else {
        const drawdown = (peak - value) / peak;
        maxDrawdown = Math.max(maxDrawdown, drawdown);
      }
    }
    
    return maxDrawdown;
  }
  
  private calculateCorrelationRisk(): number {
    // Simplified correlation risk based on position concentration
    const metrics = this.calculateBasicMetrics();
    const numPositions = this.positions.size;
    
    if (numPositions === 0) return 0;
    
    // Higher concentration = higher correlation risk
    const concentrationSum = Array.from(metrics.exposureByAsset.values())
      .reduce((sum, exposure) => sum + Math.pow(exposure / metrics.portfolioValue, 2), 0);
    
    return concentrationSum;
  }
  
  private calculateBasicMetrics(): { portfolioValue: number; exposureByAsset: Map<string, number> } {
    let portfolioValue = 0;
    const exposureByAsset = new Map<string, number>();
    
    for (const [symbol, position] of this.positions) {
      const positionValue = Math.abs(position.quantity * position.currentPrice);
      portfolioValue += positionValue;
      exposureByAsset.set(symbol, positionValue);
    }
    
    return { portfolioValue, exposureByAsset };
  }
  
  private updatePortfolioHistory(): void {
    const metrics = this.calculateBasicMetrics();
    this.portfolioHistory.push(metrics.portfolioValue);
    
    // Keep only recent history
    if (this.portfolioHistory.length > 1000) {
      this.portfolioHistory.shift();
    }
  }
  
  // Reset daily metrics (call at start of each trading day)
  resetDailyMetrics(): void {
    this.dailyPnL = 0;
  }
  
  // Emergency stop - close all positions
  emergencyStop(): void {
    console.log('EMERGENCY STOP: Closing all positions');
    for (const [symbol, position] of this.positions) {
      this.closePosition(symbol, position.currentPrice);
    }
  }
  
  // Get current positions
  getPositions(): Map<string, Position> {
    return new Map(this.positions);
  }
  
  // Update risk limits
  updateRiskLimits(newLimits: Partial<RiskLimits>): void {
    this.riskLimits = { ...this.riskLimits, ...newLimits };
  }
}
