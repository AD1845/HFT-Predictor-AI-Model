
// High-frequency trading data utilities and simulation

export interface MarketData {
  symbol: string;
  price: number;
  volume: number;
  timestamp: number;
  bid: number;
  ask: number;
  spread: number;
  change: number;
  changePercent: number;
}

export interface OrderBookEntry {
  price: number;
  size: number;
  side: 'bid' | 'ask';
}

export interface PredictionSignal {
  symbol: string;
  strategy: string;
  signal: 'buy' | 'sell' | 'hold';
  confidence: number;
  targetPrice: number;
  timeframe: number; // seconds
  reasoning: string;
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  performance: number;
  accuracy: number;
  sharpeRatio: number;
  active: boolean;
}

// Market data simulation
export const generateMarketData = (symbol: string, basePrice: number): MarketData => {
  const volatility = 0.002; // 0.2% volatility
  const priceChange = (Math.random() - 0.5) * 2 * volatility * basePrice;
  const newPrice = basePrice + priceChange;
  const spread = newPrice * 0.0001; // 0.01% spread
  
  return {
    symbol,
    price: newPrice,
    volume: Math.floor(Math.random() * 10000) + 1000,
    timestamp: Date.now(),
    bid: newPrice - spread / 2,
    ask: newPrice + spread / 2,
    spread: spread,
    change: priceChange,
    changePercent: (priceChange / basePrice) * 100
  };
};

// Generate order book data
export const generateOrderBook = (basePrice: number): OrderBookEntry[] => {
  const orderBook: OrderBookEntry[] = [];
  const spread = basePrice * 0.0001;
  
  // Generate bid side (below market price)
  for (let i = 0; i < 10; i++) {
    orderBook.push({
      price: basePrice - spread / 2 - (i * spread * 0.1),
      size: Math.floor(Math.random() * 1000) + 100,
      side: 'bid'
    });
  }
  
  // Generate ask side (above market price)
  for (let i = 0; i < 10; i++) {
    orderBook.push({
      price: basePrice + spread / 2 + (i * spread * 0.1),
      size: Math.floor(Math.random() * 1000) + 100,
      side: 'ask'
    });
  }
  
  return orderBook;
};

// AI prediction strategies
export const strategies: Strategy[] = [
  {
    id: 'momentum_scalper',
    name: 'Momentum Scalper',
    description: 'Ultra-short term momentum detection using tick data',
    performance: 12.4,
    accuracy: 67.3,
    sharpeRatio: 2.1,
    active: true
  },
  {
    id: 'mean_reversion',
    name: 'Mean Reversion ML',
    description: 'Machine learning based mean reversion with microstructure',
    performance: 8.7,
    accuracy: 72.1,
    sharpeRatio: 1.8,
    active: true
  },
  {
    id: 'orderbook_imbalance',
    name: 'Order Book Imbalance',
    description: 'Deep learning model analyzing order flow imbalances',
    performance: 15.2,
    accuracy: 64.8,
    sharpeRatio: 2.4,
    active: true
  },
  {
    id: 'latency_arbitrage',
    name: 'Latency Arbitrage',
    description: 'Cross-venue latency arbitrage detection',
    performance: 6.3,
    accuracy: 89.2,
    sharpeRatio: 3.1,
    active: false
  }
];

// Generate AI predictions
export const generatePrediction = (marketData: MarketData, strategy: Strategy): PredictionSignal => {
  const confidence = Math.random() * 0.4 + 0.6; // 60-100% confidence
  const signals = ['buy', 'sell', 'hold'] as const;
  const signal = signals[Math.floor(Math.random() * signals.length)];
  
  let targetPrice = marketData.price;
  let reasoning = '';
  
  switch (signal) {
    case 'buy':
      targetPrice = marketData.price * (1 + Math.random() * 0.001 + 0.0005);
      reasoning = `${strategy.name} detected bullish momentum. Order flow shows buying pressure.`;
      break;
    case 'sell':
      targetPrice = marketData.price * (1 - Math.random() * 0.001 - 0.0005);
      reasoning = `${strategy.name} identified selling opportunity. Market microstructure indicates downward pressure.`;
      break;
    case 'hold':
      reasoning = `${strategy.name} suggests neutral position. Market conditions unclear.`;
      break;
  }
  
  return {
    symbol: marketData.symbol,
    strategy: strategy.name,
    signal,
    confidence,
    targetPrice,
    timeframe: Math.floor(Math.random() * 30) + 15, // 15-45 seconds
    reasoning
  };
};

// Price history for charts
export const generatePriceHistory = (basePrice: number, points: number) => {
  const history = [];
  let currentPrice = basePrice;
  
  for (let i = 0; i < points; i++) {
    const volatility = 0.001;
    const change = (Math.random() - 0.5) * 2 * volatility * currentPrice;
    currentPrice += change;
    
    history.push({
      time: Date.now() - (points - i) * 1000,
      price: currentPrice,
      volume: Math.floor(Math.random() * 5000) + 1000
    });
  }
  
  return history;
};
