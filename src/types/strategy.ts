export interface TradeSignal {
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number; // 0-1
  quantity?: number;
  price?: number;
  stopLoss?: number;
  takeProfit?: number;
  reason: string;
  timestamp: string;
}

export interface RiskControls {
  maxPositionSize: number; // as percentage of portfolio
  stopLoss: number; // as percentage
  takeProfit: number; // as percentage
  maxDrawdown: number; // as percentage
  dailyLossLimit: number; // as percentage
}

export interface StrategyPerformance {
  strategyId: string;
  strategyName: string;
  totalTrades: number;
  winRate: number;
  sharpeRatio: number;
  maxDrawdown: number;
  averageLatency: number; // in milliseconds
  totalReturn: number;
  dailyReturns: number[];
  lastUpdated: string;
}

export interface MarketData {
  symbol: string;
  price: number;
  volume: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  timestamp: string;
  indicators?: {
    rsi?: number;
    macd?: number;
    sma20?: number;
    sma50?: number;
    vwap?: number;
    bollinger?: { upper: number; middle: number; lower: number };
  };
}

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  symbols: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  source: string;
  publishedAt: string;
  impact: 'high' | 'medium' | 'low';
}

export abstract class TradingStrategy {
  protected id: string;
  protected name: string;
  protected isActive: boolean;
  protected riskControls: RiskControls;
  protected performance: StrategyPerformance;

  constructor(id: string, name: string, riskControls: RiskControls) {
    this.id = id;
    this.name = name;
    this.isActive = true;
    this.riskControls = riskControls;
    this.performance = {
      strategyId: id,
      strategyName: name,
      totalTrades: 0,
      winRate: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      averageLatency: 0,
      totalReturn: 0,
      dailyReturns: [],
      lastUpdated: new Date().toISOString()
    };
  }

  abstract generateSignal(marketData: MarketData[], news?: NewsItem[]): Promise<TradeSignal[]>;

  getId(): string { return this.id; }
  getName(): string { return this.name; }
  isStrategyActive(): boolean { return this.isActive; }
  getPerformance(): StrategyPerformance { return this.performance; }
  getRiskControls(): RiskControls { return this.riskControls; }

  setActive(active: boolean): void { this.isActive = active; }
  updateRiskControls(controls: Partial<RiskControls>): void {
    this.riskControls = { ...this.riskControls, ...controls };
  }

  protected calculateSharpeRatio(returns: number[], riskFreeRate = 0.02): number {
    if (returns.length < 2) return 0;
    
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance);
    
    return volatility === 0 ? 0 : (avgReturn - riskFreeRate / 252) / volatility;
  }

  protected calculateMaxDrawdown(returns: number[]): number {
    let peak = 0;
    let maxDrawdown = 0;
    let cumulative = 0;

    for (const ret of returns) {
      cumulative += ret;
      peak = Math.max(peak, cumulative);
      const drawdown = (peak - cumulative) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }

    return maxDrawdown;
  }

  updatePerformance(newReturn: number, latency: number): void {
    this.performance.dailyReturns.push(newReturn);
    this.performance.totalTrades++;
    this.performance.totalReturn += newReturn;
    this.performance.averageLatency = (this.performance.averageLatency + latency) / 2;
    this.performance.sharpeRatio = this.calculateSharpeRatio(this.performance.dailyReturns);
    this.performance.maxDrawdown = this.calculateMaxDrawdown(this.performance.dailyReturns);
    this.performance.winRate = this.performance.dailyReturns.filter(r => r > 0).length / this.performance.dailyReturns.length;
    this.performance.lastUpdated = new Date().toISOString();
  }
}