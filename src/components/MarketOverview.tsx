import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Activity, Zap, Filter, Search, Info, BarChart3 } from 'lucide-react';
import { MarketData, generateMarketData, marketAssets } from '../utils/hftData';
import { Input } from './ui/input';
import DetailedStockView from './DetailedStockView';

const MarketOverview = () => {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showDescriptions, setShowDescriptions] = useState<boolean>(false);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);

  const getFilteredSymbols = () => {
    let entries = Object.entries(marketAssets);
    
    // Filter by category (type)
    if (selectedCategory !== 'all') {
      entries = entries.filter(([_, asset]) => asset.type === selectedCategory);
    }
    
    // Filter by sector
    if (selectedSector !== 'all') {
      entries = entries.filter(([_, asset]) => asset.sector === selectedSector);
    }
    
    // Filter by search query
    if (searchQuery) {
      entries = entries.filter(([symbol, asset]) => 
        symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (asset.description && asset.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    return entries.slice(0, 20); // Show up to 20 symbols
  };

  // Get unique sectors
  const getSectors = () => {
    const sectors = Array.from(new Set(Object.values(marketAssets).map(asset => asset.sector)));
    return sectors.sort();
  };

  useEffect(() => {
    const symbols = getFilteredSymbols();
    
    // Initialize market data
    const initialData = symbols.map(([symbol, asset]) => 
      generateMarketData(symbol, asset.basePrice)
    );
    setMarketData(initialData);

    // Update data every 800ms for more realistic feel
    const interval = setInterval(() => {
      setMarketData(prevData => {
        const currentSymbols = getFilteredSymbols();
        return currentSymbols.map(([symbol, asset], index) => 
          prevData[index] && prevData[index].symbol === symbol ? 
            generateMarketData(symbol, prevData[index].price) : 
            generateMarketData(symbol, asset.basePrice)
        );
      });
    }, 800);

    return () => clearInterval(interval);
  }, [selectedCategory, selectedSector, searchQuery]);

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
      case 'etf': return 'bg-trading-cyan/10 text-trading-cyan border-trading-cyan/20';
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
    { key: 'stock', label: 'Stocks', icon: TrendingUp },
    { key: 'crypto', label: 'Crypto', icon: Zap },
    { key: 'forex', label: 'Forex', icon: TrendingDown },
    { key: 'etf', label: 'ETFs', icon: Activity },
    { key: 'commodity', label: 'Commodities', icon: TrendingUp }
  ];

  const sectors = getSectors();

  return (
    <div className="bg-trading-surface rounded-lg border border-trading-border p-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 space-y-4 lg:space-y-0">
        <div>
          <h2 className="text-xl font-semibold text-trading-text mb-1">Market Overview</h2>
          <div className="text-sm text-trading-muted flex items-center space-x-2">
            <div className="w-2 h-2 bg-trading-green rounded-full animate-pulse"></div>
            <span>Real-time • Auto-refresh • {marketData.length} assets</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowDescriptions(!showDescriptions)}
            className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all duration-200 flex items-center space-x-1 ${
              showDescriptions
                ? 'bg-trading-blue/20 text-trading-blue border-trading-blue/30'
                : 'bg-trading-bg text-trading-muted border-trading-border hover:border-trading-blue/50'
            }`}
          >
            <Info className="w-3 h-3" />
            <span>Info</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-trading-muted" />
            <Input
              placeholder="Search symbols or descriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-trading-bg border-trading-border"
            />
          </div>
          
          <select 
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="bg-trading-bg border border-trading-border rounded-lg px-3 py-2 text-sm text-trading-text focus:border-trading-cyan focus:outline-none"
          >
            <option value="all">All Sectors</option>
            {sectors.map(sector => (
              <option key={sector} value={sector}>{sector}</option>
            ))}
          </select>
        </div>
        
        <div className="flex flex-wrap gap-2">
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {marketData.map((data) => {
          const asset = marketAssets[data.symbol as keyof typeof marketAssets];
          return (
            <div 
              key={data.symbol}
              className="bg-trading-bg rounded-lg p-4 border border-trading-border hover:border-trading-blue/50 transition-all duration-300 animate-slide-up group hover:shadow-lg hover:shadow-trading-blue/10 cursor-pointer"
              onClick={() => setSelectedAsset(data.symbol)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-trading-text">{data.symbol}</span>
                  <div className={`px-2 py-0.5 rounded text-xs font-medium border ${getAssetTypeColor(data.symbol)}`}>
                    {asset?.type?.toUpperCase()}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getTrendIcon(data.change)}
                  <BarChart3 className="w-4 h-4 text-trading-cyan opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              
              {showDescriptions && asset?.description && (
                <div className="mb-3 p-2 bg-trading-surface rounded text-xs text-trading-muted">
                  {asset.description}
                </div>
              )}
              
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
                
                {asset?.sector && (
                  <div className="text-xs text-trading-muted">
                    <span className="font-medium">Sector:</span> {asset.sector}
                  </div>
                )}
              </div>

              {/* Click hint */}
              <div className="mt-2 text-xs text-trading-cyan opacity-0 group-hover:opacity-100 transition-opacity text-center">
                Click for detailed analysis
              </div>
            </div>
          );
        })}
      </div>

      {marketData.length === 0 && (
        <div className="text-center py-8">
          <div className="text-trading-muted">No assets found matching your criteria</div>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedSector('all');
            }}
            className="mt-2 text-trading-blue hover:text-trading-blue/80 text-sm"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Detailed Stock View Modal */}
      {selectedAsset && (
        <DetailedStockView 
          symbol={selectedAsset} 
          onClose={() => setSelectedAsset(null)} 
        />
      )}
    </div>
  );
};

export default MarketOverview;
