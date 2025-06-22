
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Activity, Zap } from 'lucide-react';
import { MarketData, generateMarketData, marketAssets } from '../utils/hftData';

const MarketOverview = () => {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Get diverse market symbols
  const getSymbolsByCategory = (category: string) => {
    const entries = Object.entries(marketAssets);
    if (category === 'all') {
      return entries.slice(0, 12); // Show top 12 across all categories
    }
    return entries.filter(([_, asset]) => asset.type === category).slice(0, 8);
  };

  useEffect(() => {
    const symbols = getSymbolsByCategory(selectedCategory);
    
    // Initialize market data
    const initialData = symbols.map(([symbol, asset]) => 
      generateMarketData(symbol, asset.basePrice)
    );
    setMarketData(initialData);

    // Update data every 800ms for more realistic feel
    const interval = setInterval(() => {
      setMarketData(prevData => {
        const currentSymbols = getSymbolsByCategory(selectedCategory);
        return currentSymbols.map(([symbol, asset], index) => 
          prevData[index] ? 
            generateMarketData(symbol, prevData[index].price) : 
            generateMarketData(symbol, asset.basePrice)
        );
      });
    }, 800);

    return () => clearInterval(interval);
  }, [selectedCategory]);

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-trading-green" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-trading-red" />;
    return <Minus className="w-4 h-4 text-trading-muted" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-trading-green';
    if (change < 0) return 'text-trading-red';
    return 'text-trading-muted';
  };

  const getAssetTypeColor = (symbol: string) => {
    const asset = marketAssets[symbol as keyof typeof marketAssets];
    switch (asset?.type) {
      case 'crypto': return 'bg-trading-orange/10 text-trading-orange border-trading-orange/20';
      case 'stock': return 'bg-trading-blue/10 text-trading-blue border-trading-blue/20';
      case 'forex': return 'bg-trading-purple/10 text-trading-purple border-trading-purple/20';
      case 'commodity': return 'bg-trading-yellow/10 text-trading-yellow border-trading-yellow/20';
      default: return 'bg-trading-muted/10 text-trading-muted border-trading-muted/20';
    }
  };

  const formatPrice = (price: number, symbol: string) => {
    const asset = marketAssets[symbol as keyof typeof marketAssets];
    if (asset?.type === 'crypto' && symbol.includes('USD')) {
      return symbol.includes('BTC') || symbol.includes('ETH') ? price.toFixed(0) : price.toFixed(4);
    }
    if (asset?.type === 'forex') return price.toFixed(4);
    return price.toFixed(2);
  };

  const categories = [
    { key: 'all', label: 'All Markets', icon: Activity },
    { key: 'crypto', label: 'Crypto', icon: Zap },
    { key: 'stock', label: 'Stocks', icon: TrendingUp },
    { key: 'forex', label: 'Forex', icon: TrendingDown }
  ];

  return (
    <div className="bg-trading-surface rounded-lg border border-trading-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-trading-text mb-1">Market Overview</h2>
          <div className="text-sm text-trading-muted flex items-center space-x-2">
            <div className="w-2 h-2 bg-trading-green rounded-full animate-pulse"></div>
            <span>Real-time • Auto-refresh • {marketData.length} assets</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {categories.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all duration-200 flex items-center space-x-1 ${
                selectedCategory === key
                  ? 'bg-trading-blue/20 text-trading-blue border-trading-blue/30'
                  : 'bg-trading-bg text-trading-muted border-trading-border hover:border-trading-blue/50'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {marketData.map((data) => {
          const asset = marketAssets[data.symbol as keyof typeof marketAssets];
          return (
            <div 
              key={data.symbol}
              className="bg-trading-bg rounded-lg p-4 border border-trading-border hover:border-trading-blue/50 transition-all duration-300 animate-slide-up group hover:shadow-lg hover:shadow-trading-blue/10"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-trading-text">{data.symbol}</span>
                  <div className={`px-2 py-0.5 rounded text-xs font-medium border ${getAssetTypeColor(data.symbol)}`}>
                    {asset?.type?.toUpperCase()}
                  </div>
                </div>
                {getTrendIcon(data.change)}
              </div>
              
              <div className="space-y-2">
                <div className="text-2xl font-mono font-bold text-trading-text">
                  ${formatPrice(data.price, data.symbol)}
                </div>
                
                <div className={`text-sm font-mono ${getChangeColor(data.change)} flex items-center space-x-1`}>
                  <span>
                    {data.change > 0 ? '+' : ''}{data.change.toFixed(4)}
                  </span>
                  <span>
                    ({data.changePercent > 0 ? '+' : ''}{data.changePercent.toFixed(2)}%)
                  </span>
                </div>
                
                <div className="flex justify-between text-xs text-trading-muted pt-2 border-t border-trading-border/50">
                  <div>
                    <div className="text-trading-muted">Spread</div>
                    <div className="font-mono">${data.spread.toFixed(4)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-trading-muted">Vol</div>
                    <div className="font-mono">{(data.volume / 1000).toFixed(1)}K</div>
                  </div>
                </div>
                
                {data.volatility > 0 && (
                  <div className="flex justify-between text-xs text-trading-muted">
                    <div>
                      <div className="text-trading-muted">Volatility</div>
                      <div className={`font-mono ${data.volatility > 0.1 ? 'text-trading-red' : 'text-trading-cyan'}`}>
                        {data.volatility.toFixed(3)}%
                      </div>
                    </div>
                    {data.marketCap && (
                      <div className="text-right">
                        <div className="text-trading-muted">MCap</div>
                        <div className="font-mono text-trading-cyan">
                          ${(data.marketCap / 1e9).toFixed(1)}B
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MarketOverview;
