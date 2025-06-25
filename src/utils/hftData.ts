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
  marketCap?: number;
  volatility: number;
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
  riskLevel: 'low' | 'medium' | 'high';
  expectedReturn: number;
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  performance: number;
  accuracy: number;
  sharpeRatio: number;
  active: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  winRate: number;
}

export interface MarketSentiment {
  symbol: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  score: number; // -100 to 100
  volume24h: number;
  socialMentions: number;
}

// Extended market data with crypto and traditional assets
export const marketAssets = {
  // Technology Stocks
  'AAPL': { basePrice: 185.50, type: 'stock', sector: 'Technology', description: 'Apple Inc. - Consumer electronics and software' },
  'GOOGL': { basePrice: 142.30, type: 'stock', sector: 'Technology', description: 'Alphabet Inc. - Search engine and cloud services' },
  'MSFT': { basePrice: 378.25, type: 'stock', sector: 'Technology', description: 'Microsoft Corporation - Software and cloud computing' },
  'NVDA': { basePrice: 465.80, type: 'stock', sector: 'Technology', description: 'NVIDIA Corporation - Graphics processing and AI chips' },
  'META': { basePrice: 325.50, type: 'stock', sector: 'Technology', description: 'Meta Platforms - Social media and virtual reality' },
  'NFLX': { basePrice: 445.75, type: 'stock', sector: 'Technology', description: 'Netflix Inc. - Streaming entertainment service' },
  'CRM': { basePrice: 285.40, type: 'stock', sector: 'Technology', description: 'Salesforce Inc. - Customer relationship management' },
  'ADBE': { basePrice: 575.20, type: 'stock', sector: 'Technology', description: 'Adobe Inc. - Creative software and digital marketing' },
  
  // Automotive & Energy
  'TSLA': { basePrice: 248.75, type: 'stock', sector: 'Automotive', description: 'Tesla Inc. - Electric vehicles and energy storage' },
  'F': { basePrice: 12.45, type: 'stock', sector: 'Automotive', description: 'Ford Motor Company - Traditional automotive manufacturer' },
  'GM': { basePrice: 38.90, type: 'stock', sector: 'Automotive', description: 'General Motors - Automotive and mobility services' },
  'XOM': { basePrice: 115.60, type: 'stock', sector: 'Energy', description: 'Exxon Mobil Corporation - Oil and gas company' },
  
  // Financial Services
  'JPM': { basePrice: 175.85, type: 'stock', sector: 'Financial', description: 'JPMorgan Chase & Co. - Investment banking and financial services' },
  'BAC': { basePrice: 41.20, type: 'stock', sector: 'Financial', description: 'Bank of America - Consumer and commercial banking' },
  'WFC': { basePrice: 58.75, type: 'stock', sector: 'Financial', description: 'Wells Fargo & Company - Banking and financial services' },
  'GS': { basePrice: 385.40, type: 'stock', sector: 'Financial', description: 'Goldman Sachs Group - Investment banking and securities' },
  
  // Healthcare & Pharmaceuticals
  'JNJ': { basePrice: 155.30, type: 'stock', sector: 'Healthcare', description: 'Johnson & Johnson - Pharmaceuticals and medical devices' },
  'PFE': { basePrice: 28.65, type: 'stock', sector: 'Healthcare', description: 'Pfizer Inc. - Pharmaceutical company' },
  'UNH': { basePrice: 525.90, type: 'stock', sector: 'Healthcare', description: 'UnitedHealth Group - Health insurance and healthcare services' },
  'ABBV': { basePrice: 175.45, type: 'stock', sector: 'Healthcare', description: 'AbbVie Inc. - Biopharmaceutical company' },
  
  // Consumer & Retail
  'AMZN': { basePrice: 145.25, type: 'stock', sector: 'Consumer', description: 'Amazon.com Inc. - E-commerce and cloud computing' },
  'WMT': { basePrice: 165.80, type: 'stock', sector: 'Consumer', description: 'Walmart Inc. - Retail corporation' },
  'HD': { basePrice: 385.70, type: 'stock', sector: 'Consumer', description: 'Home Depot Inc. - Home improvement retailer' },
  'NKE': { basePrice: 85.40, type: 'stock', sector: 'Consumer', description: 'Nike Inc. - Athletic footwear and apparel' },
  
  // ETFs & Indices
  'SPY': { basePrice: 445.20, type: 'etf', sector: 'Index', description: 'SPDR S&P 500 ETF - Tracks S&P 500 index' },
  'QQQ': { basePrice: 385.60, type: 'etf', sector: 'Index', description: 'Invesco QQQ Trust - Tracks NASDAQ-100 index' },
  'IWM': { basePrice: 220.30, type: 'etf', sector: 'Index', description: 'iShares Russell 2000 ETF - Small-cap stocks' },
  
  // Major Cryptocurrencies
  'BTC/USD': { basePrice: 67500, type: 'crypto', sector: 'Cryptocurrency', description: 'Bitcoin - The original cryptocurrency and digital gold' },
  'ETH/USD': { basePrice: 3450, type: 'crypto', sector: 'Cryptocurrency', description: 'Ethereum - Smart contract platform and decentralized apps' },
  'SOL/USD': { basePrice: 145.80, type: 'crypto', sector: 'Cryptocurrency', description: 'Solana - High-performance blockchain for dApps' },
  'ADA/USD': { basePrice: 0.45, type: 'crypto', sector: 'Cryptocurrency', description: 'Cardano - Proof-of-stake blockchain platform' },
  'DOT/USD': { basePrice: 6.85, type: 'crypto', sector: 'Cryptocurrency', description: 'Polkadot - Interoperable blockchain network' },
  'MATIC/USD': { basePrice: 0.92, type: 'crypto', sector: 'Cryptocurrency', description: 'Polygon - Ethereum scaling and infrastructure' },
  'AVAX/USD': { basePrice: 35.40, type: 'crypto', sector: 'Cryptocurrency', description: 'Avalanche - Platform for decentralized applications' },
  'LINK/USD': { basePrice: 14.75, type: 'crypto', sector: 'Cryptocurrency', description: 'Chainlink - Decentralized oracle network' },
  
  // Forex Pairs
  'EUR/USD': { basePrice: 1.0845, type: 'forex', sector: 'Currency', description: 'Euro vs US Dollar - Most traded currency pair' },
  'GBP/USD': { basePrice: 1.2675, type: 'forex', sector: 'Currency', description: 'British Pound vs US Dollar - Cable' },
  'USD/JPY': { basePrice: 149.85, type: 'forex', sector: 'Currency', description: 'US Dollar vs Japanese Yen - Major Asian pair' },
  'AUD/USD': { basePrice: 0.6720, type: 'forex', sector: 'Currency', description: 'Australian Dollar vs US Dollar - Aussie' },
  
  // Commodities
  'GOLD': { basePrice: 2025.50, type: 'commodity', sector: 'Precious Metals', description: 'Gold futures - Safe haven precious metal' },
  'SILVER': { basePrice: 24.85, type: 'commodity', sector: 'Precious Metals', description: 'Silver futures - Industrial and precious metal' },
  'OIL': { basePrice: 78.90, type: 'commodity', sector: 'Energy', description: 'Crude Oil futures - Global energy commodity' },
  'COPPER': { basePrice: 3.85, type: 'commodity', sector: 'Industrial Metals', description: 'Copper futures - Industrial metal and economic indicator' }
};

// Market data simulation with enhanced features
export const generateMarketData = (symbol: string, basePrice: number): MarketData => {
  const asset = marketAssets[symbol as keyof typeof marketAssets];
  const volatilityMultiplier = asset?.type === 'crypto' ? 0.004 : 
                               asset?.type === 'forex' ? 0.0008 : 0.002;
  
  const priceChange = (Math.random() - 0.5) * 2 * volatilityMultiplier * basePrice;
  const newPrice = basePrice + priceChange;
  const spread = newPrice * (asset?.type === 'crypto' ? 0.0005 : 0.0001);
  
  return {
    symbol,
    price: newPrice,
    volume: Math.floor(Math.random() * (asset?.type === 'crypto' ? 50000 : 10000)) + 1000,
    timestamp: Date.now(),
    bid: newPrice - spread / 2,
    ask: newPrice + spread / 2,
    spread: spread,
    change: priceChange,
    changePercent: (priceChange / basePrice) * 100,
    marketCap: asset?.type === 'crypto' ? Math.floor(newPrice * (Math.random() * 1000000000 + 500000000)) : undefined,
    volatility: Math.abs(priceChange / basePrice) * 100
  };
};

// Enhanced AI prediction strategies
export const strategies: Strategy[] = [
  {
    id: 'momentum_scalper',
    name: 'Momentum Scalper',
    description: 'Ultra-short term momentum detection using tick data and volume analysis',
    performance: 12.4,
    accuracy: 67.3,
    sharpeRatio: 2.1,
    active: true,
    riskLevel: 'high',
    winRate: 72.5
  },
  {
    id: 'mean_reversion',
    name: 'Mean Reversion ML',
    description: 'Machine learning based mean reversion with microstructure patterns',
    performance: 8.7,
    accuracy: 72.1,
    sharpeRatio: 1.8,
    active: true,
    riskLevel: 'medium',
    winRate: 68.9
  },
  {
    id: 'orderbook_imbalance',
    name: 'Order Flow Imbalance',
    description: 'Deep learning model analyzing order flow imbalances and liquidity',
    performance: 15.2,
    accuracy: 64.8,
    sharpeRatio: 2.4,
    active: true,
    riskLevel: 'high',
    winRate: 65.2
  },
  {
    id: 'crypto_sentiment',
    name: 'Crypto Sentiment AI',
    description: 'Social media and news sentiment analysis for cryptocurrency markets',
    performance: 18.6,
    accuracy: 69.4,
    sharpeRatio: 2.8,
    active: true,
    riskLevel: 'medium',
    winRate: 74.1
  },
  {
    id: 'cross_asset_arbitrage',
    name: 'Cross-Asset Arbitrage',
    description: 'Multi-market arbitrage opportunities across stocks, crypto, and forex',
    performance: 11.3,
    accuracy: 85.7,
    sharpeRatio: 3.2,
    active: true,
    riskLevel: 'low',
    winRate: 89.3
  },
  {
    id: 'latency_arbitrage',
    name: 'Latency Arbitrage',
    description: 'Cross-venue latency arbitrage detection with microsecond precision',
    performance: 6.3,
    accuracy: 89.2,
    sharpeRatio: 3.1,
    active: false,
    riskLevel: 'low',
    winRate: 91.8
  }
];

// Generate enhanced AI predictions
export const generatePrediction = (marketData: MarketData, strategy: Strategy): PredictionSignal => {
  const confidence = Math.random() * 0.35 + 0.65; // 65-100% confidence
  const signals = ['buy', 'sell', 'hold'] as const;
  const signal = signals[Math.floor(Math.random() * signals.length)];
  
  let targetPrice = marketData.price;
  let reasoning = '';
  let expectedReturn = 0;
  
  const asset = marketAssets[marketData.symbol as keyof typeof marketAssets];
  const returnMultiplier = asset?.type === 'crypto' ? 0.002 : 0.001;
  
  switch (signal) {
    case 'buy':
      const upwardMove = Math.random() * 0.002 + 0.0008;
      targetPrice = marketData.price * (1 + upwardMove);
      expectedReturn = upwardMove * 100;
      reasoning = `${strategy.name} detected ${asset?.type === 'crypto' ? 'strong bullish momentum in crypto markets' : 'buying pressure in order flow'}. ${strategy.riskLevel === 'high' ? 'High volatility expected.' : 'Stable upward movement predicted.'}`;
      break;
    case 'sell':
      const downwardMove = Math.random() * 0.002 + 0.0008;
      targetPrice = marketData.price * (1 - downwardMove);
      expectedReturn = downwardMove * 100;
      reasoning = `${strategy.name} identified ${asset?.type === 'crypto' ? 'bearish sentiment in crypto space' : 'selling pressure in microstructure'}. ${confidence > 0.8 ? 'High confidence signal.' : 'Moderate strength signal.'}`;
      break;
    case 'hold':
      expectedReturn = 0;
      reasoning = `${strategy.name} suggests neutral position. Market conditions show ${asset?.type === 'forex' ? 'currency pair consolidation' : 'sideways movement expected'}.`;
      break;
  }
  
  return {
    symbol: marketData.symbol,
    strategy: strategy.name,
    signal,
    confidence,
    targetPrice,
    timeframe: Math.floor(Math.random() * 45) + 15, // 15-60 seconds
    reasoning,
    riskLevel: strategy.riskLevel,
    expectedReturn
  };
};

// Generate market sentiment data
export const generateMarketSentiment = (symbol: string): MarketSentiment => {
  const asset = marketAssets[symbol as keyof typeof marketAssets];
  const sentiments = ['bullish', 'bearish', 'neutral'] as const;
  const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
  
  return {
    symbol,
    sentiment,
    score: (Math.random() - 0.5) * 200, // -100 to 100
    volume24h: Math.floor(Math.random() * 1000000000) + 100000000,
    socialMentions: asset?.type === 'crypto' ? Math.floor(Math.random() * 10000) + 1000 : Math.floor(Math.random() * 1000) + 100
  };
};

// Price history for charts with enhanced data
export const generatePriceHistory = (basePrice: number, points: number) => {
  const history = [];
  let currentPrice = basePrice;
  
  for (let i = 0; i < points; i++) {
    const volatility = 0.0015;
    const change = (Math.random() - 0.5) * 2 * volatility * currentPrice;
    currentPrice += change;
    
    history.push({
      time: Date.now() - (points - i) * 1000,
      price: currentPrice,
      volume: Math.floor(Math.random() * 8000) + 1000,
      high: currentPrice * (1 + Math.random() * 0.001),
      low: currentPrice * (1 - Math.random() * 0.001),
      close: currentPrice
    });
  }
  
  return history;
};
