export interface OrderBookLevel {
  price: number;
  size: number;
}

export interface OrderBookSnapshot {
  symbol: string;
  timestamp: number;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  lastPrice: number;
  lastSize: number;
}

export interface OrderBookFeatures {
  // Basic features
  spread: number;
  midPrice: number;
  microPrice: number;
  
  // Flow features
  orderFlowImbalance: number;
  volumeImbalance: number;
  depthImbalance: number;
  
  // Pressure features
  buyPressure: number;
  sellPressure: number;
  pressureRatio: number;
  
  // Depth features
  bidDepth: number;
  askDepth: number;
  depthRatio: number;
  
  // VWAP features
  vwap: number;
  vwapDeviation: number;
  
  // Microstructure features
  tickDirection: number;
  aggressorSide: 'BUY' | 'SELL' | 'PASSIVE';
  tradeIntensity: number;
  
  // Advanced features
  smartMoney: number;
  liquidityTaking: number;
  marketImpact: number;
}

export class OrderBookFeatureExtractor {
  private priceHistory: Map<string, number[]> = new Map();
  private volumeHistory: Map<string, number[]> = new Map();
  private vwapHistory: Map<string, number[]> = new Map();
  
  extractFeatures(snapshot: OrderBookSnapshot, historicalSnapshots?: OrderBookSnapshot[]): OrderBookFeatures {
    const bids = snapshot.bids.slice(0, 10); // Top 10 levels
    const asks = snapshot.asks.slice(0, 10);
    
    // Basic calculations
    const bestBid = bids[0]?.price || 0;
    const bestAsk = asks[0]?.price || 0;
    const spread = bestAsk - bestBid;
    const midPrice = (bestBid + bestAsk) / 2;
    
    // Micro price calculation
    const bidSize = bids[0]?.size || 0;
    const askSize = asks[0]?.size || 0;
    const microPrice = (bestBid * askSize + bestAsk * bidSize) / (bidSize + askSize);
    
    // Order flow imbalance
    const totalBidVolume = bids.reduce((sum, level) => sum + level.size, 0);
    const totalAskVolume = asks.reduce((sum, level) => sum + level.size, 0);
    const orderFlowImbalance = (totalBidVolume - totalAskVolume) / (totalBidVolume + totalAskVolume);
    
    // Volume imbalance at best levels
    const volumeImbalance = (bidSize - askSize) / (bidSize + askSize);
    
    // Depth imbalance (weighted by distance from mid)
    const bidDepthValue = this.calculateWeightedDepth(bids, midPrice, 'bid');
    const askDepthValue = this.calculateWeightedDepth(asks, midPrice, 'ask');
    const depthImbalance = (bidDepthValue - askDepthValue) / (bidDepthValue + askDepthValue);
    
    // Pressure calculations
    const buyPressure = this.calculateBuyPressure(bids, asks);
    const sellPressure = this.calculateSellPressure(bids, asks);
    const pressureRatio = buyPressure / (sellPressure + 0.001);
    
    // VWAP calculations
    const vwap = this.calculateVWAP(snapshot);
    const vwapDeviation = (snapshot.lastPrice - vwap) / vwap;
    
    // Tick direction and aggressor detection
    const tickDirection = this.getTickDirection(snapshot);
    const aggressorSide = this.detectAggressorSide(snapshot, bestBid, bestAsk);
    
    // Advanced microstructure features
    const smartMoney = this.calculateSmartMoneyFlow(snapshot, historicalSnapshots);
    const liquidityTaking = this.calculateLiquidityTaking(snapshot);
    const marketImpact = this.calculateMarketImpact(snapshot);
    const tradeIntensity = this.calculateTradeIntensity(snapshot);
    
    return {
      spread,
      midPrice,
      microPrice,
      orderFlowImbalance,
      volumeImbalance,
      depthImbalance,
      buyPressure,
      sellPressure,
      pressureRatio,
      bidDepth: totalBidVolume,
      askDepth: totalAskVolume,
      depthRatio: totalBidVolume / (totalAskVolume + 0.001),
      vwap,
      vwapDeviation,
      tickDirection,
      aggressorSide,
      tradeIntensity,
      smartMoney,
      liquidityTaking,
      marketImpact
    };
  }
  
  private calculateWeightedDepth(levels: OrderBookLevel[], midPrice: number, side: 'bid' | 'ask'): number {
    return levels.reduce((sum, level) => {
      const distance = Math.abs(level.price - midPrice) / midPrice;
      const weight = Math.exp(-distance * 10); // Exponential decay
      return sum + level.size * weight;
    }, 0);
  }
  
  private calculateBuyPressure(bids: OrderBookLevel[], asks: OrderBookLevel[]): number {
    const bidStrength = bids.slice(0, 5).reduce((sum, level) => sum + level.size, 0);
    const totalLiquidity = bids.slice(0, 5).reduce((sum, level) => sum + level.size, 0) +
                          asks.slice(0, 5).reduce((sum, level) => sum + level.size, 0);
    return bidStrength / totalLiquidity;
  }
  
  private calculateSellPressure(bids: OrderBookLevel[], asks: OrderBookLevel[]): number {
    const askStrength = asks.slice(0, 5).reduce((sum, level) => sum + level.size, 0);
    const totalLiquidity = bids.slice(0, 5).reduce((sum, level) => sum + level.size, 0) +
                          asks.slice(0, 5).reduce((sum, level) => sum + level.size, 0);
    return askStrength / totalLiquidity;
  }
  
  private calculateVWAP(snapshot: OrderBookSnapshot): number {
    const history = this.vwapHistory.get(snapshot.symbol) || [];
    history.push(snapshot.lastPrice * snapshot.lastSize);
    
    if (history.length > 100) history.shift();
    this.vwapHistory.set(snapshot.symbol, history);
    
    const totalValue = history.reduce((sum, value) => sum + value, 0);
    const totalVolume = history.length * snapshot.lastSize; // Simplified
    
    return totalValue / totalVolume;
  }
  
  private getTickDirection(snapshot: OrderBookSnapshot): number {
    const history = this.priceHistory.get(snapshot.symbol) || [];
    const lastPrice = history[history.length - 1];
    
    history.push(snapshot.lastPrice);
    if (history.length > 1000) history.shift();
    this.priceHistory.set(snapshot.symbol, history);
    
    if (!lastPrice) return 0;
    
    if (snapshot.lastPrice > lastPrice) return 1;
    if (snapshot.lastPrice < lastPrice) return -1;
    return 0;
  }
  
  private detectAggressorSide(snapshot: OrderBookSnapshot, bestBid: number, bestAsk: number): 'BUY' | 'SELL' | 'PASSIVE' {
    if (snapshot.lastPrice >= bestAsk) return 'BUY';
    if (snapshot.lastPrice <= bestBid) return 'SELL';
    return 'PASSIVE';
  }
  
  private calculateSmartMoneyFlow(snapshot: OrderBookSnapshot, historicalSnapshots?: OrderBookSnapshot[]): number {
    // Simplified smart money detection based on large orders vs price movement
    const largeOrderThreshold = snapshot.lastSize * 5;
    const isLargeOrder = snapshot.lastSize > largeOrderThreshold;
    const priceMovement = this.getTickDirection(snapshot);
    
    if (isLargeOrder && priceMovement !== 0) {
      return priceMovement * Math.log(snapshot.lastSize / largeOrderThreshold);
    }
    
    return 0;
  }
  
  private calculateLiquidityTaking(snapshot: OrderBookSnapshot): number {
    // Ratio of market orders vs limit orders (simplified)
    const aggressorSide = this.detectAggressorSide(
      snapshot, 
      snapshot.bids[0]?.price || 0, 
      snapshot.asks[0]?.price || 0
    );
    
    return aggressorSide === 'PASSIVE' ? 0 : 1;
  }
  
  private calculateMarketImpact(snapshot: OrderBookSnapshot): number {
    // Simplified market impact based on order size vs book depth
    const totalDepth = (snapshot.bids[0]?.size || 0) + (snapshot.asks[0]?.size || 0);
    return Math.log(snapshot.lastSize / (totalDepth + 1));
  }
  
  private calculateTradeIntensity(snapshot: OrderBookSnapshot): number {
    // Simplified trade intensity based on recent activity
    return Math.min(snapshot.lastSize / 1000, 1); // Normalized to 0-1
  }
}