
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { MarketData, generateMarketData } from '../utils/hftData';

const symbols = [
  { name: 'AAPL', basePrice: 185.50 },
  { name: 'GOOGL', basePrice: 142.30 },
  { name: 'TSLA', basePrice: 248.75 },
  { name: 'MSFT', basePrice: 378.25 },
  { name: 'BTC/USD', basePrice: 67500 },
  { name: 'ETH/USD', basePrice: 3450 }
];

const MarketOverview = () => {
  const [marketData, setMarketData] = useState<MarketData[]>([]);

  useEffect(() => {
    // Initialize market data
    const initialData = symbols.map(symbol => 
      generateMarketData(symbol.name, symbol.basePrice)
    );
    setMarketData(initialData);

    // Update data every 500ms
    const interval = setInterval(() => {
      setMarketData(prevData => 
        prevData.map((data, index) => 
          generateMarketData(symbols[index].name, data.price)
        )
      );
    }, 500);

    return () => clearInterval(interval);
  }, []);

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

  return (
    <div className="bg-trading-surface rounded-lg border border-trading-border p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-trading-text">Market Overview</h2>
        <div className="text-xs text-trading-muted">Real-time • Auto-refresh</div>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {marketData.map((data) => (
          <div 
            key={data.symbol}
            className="bg-trading-bg rounded-lg p-3 border border-trading-border hover:border-trading-blue transition-all duration-200 animate-slide-up"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-trading-text">{data.symbol}</span>
              {getTrendIcon(data.change)}
            </div>
            
            <div className="space-y-1">
              <div className="text-xl font-mono font-bold text-trading-text">
                ${data.price.toFixed(data.symbol.includes('USD') ? 0 : 2)}
              </div>
              
              <div className={`text-sm font-mono ${getChangeColor(data.change)}`}>
                {data.change > 0 ? '+' : ''}{data.change.toFixed(4)} 
                ({data.changePercent > 0 ? '+' : ''}{data.changePercent.toFixed(2)}%)
              </div>
              
              <div className="flex justify-between text-xs text-trading-muted">
                <span>Spread: ${data.spread.toFixed(4)}</span>
                <span>Vol: {(data.volume / 1000).toFixed(1)}K</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarketOverview;
