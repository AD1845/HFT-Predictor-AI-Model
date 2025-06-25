
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, AreaChart, Area, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, Clock, Calendar, BarChart3, Activity, Zap, ArrowUp, ArrowDown, Info } from 'lucide-react';
import { generatePriceHistory, marketAssets, MarketData, generateMarketData } from '../utils/hftData';

interface DetailedStockViewProps {
  symbol: string;
  onClose: () => void;
}

interface HistoricalData {
  time: number;
  price: number;
  volume: number;
  change: number;
  rsi: number;
  ma20: number;
  volatility: number;
}

const DetailedStockView: React.FC<DetailedStockViewProps> = ({ symbol, onClose }) => {
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [currentData, setCurrentData] = useState<MarketData | null>(null);
  const [timeframe, setTimeframe] = useState<'1m' | '5m' | '1h' | '1d'>('1m');
  const [chartType, setChartType] = useState<'line' | 'area' | 'candlestick'>('area');
  const [showIndicators, setShowIndicators] = useState(true);

  const asset = marketAssets[symbol as keyof typeof marketAssets];

  useEffect(() => {
    if (!asset) return;

    // Generate extended historical data
    const generateExtendedHistory = () => {
      const points = timeframe === '1m' ? 60 : timeframe === '5m' ? 288 : timeframe === '1h' ? 168 : 30;
      const baseData = generatePriceHistory(asset.basePrice, points);
      
      return baseData.map((point, index) => {
        const prices = baseData.slice(Math.max(0, index - 19), index + 1).map(p => p.price);
        const ma20 = prices.reduce((a, b) => a + b, 0) / prices.length;
        
        // Simple RSI calculation
        const changes = prices.slice(1).map((price, i) => price - prices[i]);
        const gains = changes.filter(c => c > 0).reduce((a, b) => a + b, 0) / changes.length || 0;
        const losses = Math.abs(changes.filter(c => c < 0).reduce((a, b) => a + b, 0)) / changes.length || 0;
        const rsi = losses === 0 ? 100 : 100 - (100 / (1 + gains / losses));
        
        const volatility = prices.length > 1 ? 
          Math.sqrt(prices.reduce((sum, price) => sum + Math.pow(price - ma20, 2), 0) / prices.length) : 0;

        return {
          ...point,
          change: index > 0 ? point.price - baseData[index - 1].price : 0,
          ma20,
          rsi: isNaN(rsi) ? 50 : rsi,
          volatility: (volatility / ma20) * 100
        };
      });
    };

    setHistoricalData(generateExtendedHistory());

    // Update current data
    const updateCurrentData = () => {
      setCurrentData(generateMarketData(symbol, asset.basePrice));
    };

    updateCurrentData();
    const interval = setInterval(updateCurrentData, 1000);

    return () => clearInterval(interval);
  }, [symbol, timeframe, asset]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    if (timeframe === '1m' || timeframe === '5m') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (timeframe === '1h') {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const calculateStats = () => {
    if (historicalData.length === 0) return null;

    const prices = historicalData.map(d => d.price);
    const volumes = historicalData.map(d => d.volume);
    const changes = historicalData.map(d => d.change);

    return {
      high24h: Math.max(...prices),
      low24h: Math.min(...prices),
      avgVolume: volumes.reduce((a, b) => a + b, 0) / volumes.length,
      avgChange: changes.reduce((a, b) => a + b, 0) / changes.length,
      volatility: Math.sqrt(changes.reduce((sum, change) => sum + Math.pow(change, 2), 0) / changes.length),
      trend: changes[changes.length - 1] > 0 ? 'bullish' : 'bearish'
    };
  };

  const stats = calculateStats();

  if (!asset || !currentData) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-trading-surface rounded-lg p-6 border border-trading-border">
          <div className="text-trading-text">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-trading-surface rounded-lg border border-trading-border w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-trading-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div>
                <h2 className="text-2xl font-bold text-trading-text">{symbol}</h2>
                <p className="text-trading-muted text-sm">{asset.description}</p>
              </div>
              <div className={`px-3 py-1 rounded border ${
                asset.type === 'crypto' ? 'bg-trading-orange/10 text-trading-orange border-trading-orange/20' :
                asset.type === 'stock' ? 'bg-trading-blue/10 text-trading-blue border-trading-blue/20' :
                asset.type === 'forex' ? 'bg-trading-purple/10 text-trading-purple border-trading-purple/20' :
                'bg-trading-yellow/10 text-trading-yellow border-trading-yellow/20'
              }`}>
                {asset.type.toUpperCase()}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-trading-muted hover:text-trading-text transition-colors text-xl"
            >
              ×
            </button>
          </div>

          {/* Current Price and Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-trading-bg rounded-lg p-4">
              <div className="text-trading-muted text-sm">Current Price</div>
              <div className="text-2xl font-mono font-bold text-trading-text">
                ${currentData.price.toFixed(asset.type === 'forex' ? 4 : 2)}
              </div>
              <div className={`text-sm font-mono flex items-center space-x-1 ${
                currentData.change >= 0 ? 'text-trading-green' : 'text-trading-red'
              }`}>
                {currentData.change >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                <span>{currentData.change >= 0 ? '+' : ''}{currentData.change.toFixed(4)}</span>
                <span>({currentData.changePercent >= 0 ? '+' : ''}{currentData.changePercent.toFixed(2)}%)</span>
              </div>
            </div>

            {stats && (
              <>
                <div className="bg-trading-bg rounded-lg p-4">
                  <div className="text-trading-muted text-sm">24H Range</div>
                  <div className="text-trading-text font-mono">
                    ${stats.low24h.toFixed(2)} - ${stats.high24h.toFixed(2)}
                  </div>
                  <div className="text-xs text-trading-cyan">
                    Volatility: {stats.volatility.toFixed(2)}%
                  </div>
                </div>

                <div className="bg-trading-bg rounded-lg p-4">
                  <div className="text-trading-muted text-sm">Volume</div>
                  <div className="text-trading-text font-mono">
                    {(currentData.volume / 1000).toFixed(1)}K
                  </div>
                  <div className="text-xs text-trading-cyan">
                    Avg: {(stats.avgVolume / 1000).toFixed(1)}K
                  </div>
                </div>

                <div className="bg-trading-bg rounded-lg p-4">
                  <div className="text-trading-muted text-sm">Trend</div>
                  <div className={`flex items-center space-x-1 ${
                    stats.trend === 'bullish' ? 'text-trading-green' : 'text-trading-red'
                  }`}>
                    {stats.trend === 'bullish' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span className="capitalize font-medium">{stats.trend}</span>
                  </div>
                  <div className="text-xs text-trading-muted">
                    Avg Change: {stats.avgChange >= 0 ? '+' : ''}{stats.avgChange.toFixed(4)}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="p-6 border-b border-trading-border">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-trading-muted" />
              <span className="text-sm text-trading-muted">Timeframe:</span>
              {['1m', '5m', '1h', '1d'].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf as any)}
                  className={`px-3 py-1 rounded text-sm border transition-colors ${
                    timeframe === tf
                      ? 'bg-trading-cyan/20 text-trading-cyan border-trading-cyan/30'
                      : 'bg-trading-bg text-trading-muted border-trading-border hover:border-trading-cyan/50'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-trading-muted" />
              <span className="text-sm text-trading-muted">Chart:</span>
              {[
                { key: 'line', label: 'Line' },
                { key: 'area', label: 'Area' },
                { key: 'candlestick', label: 'Candle' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setChartType(key as any)}
                  className={`px-3 py-1 rounded text-sm border transition-colors ${
                    chartType === key
                      ? 'bg-trading-cyan/20 text-trading-cyan border-trading-cyan/30'
                      : 'bg-trading-bg text-trading-muted border-trading-border hover:border-trading-cyan/50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowIndicators(!showIndicators)}
              className={`px-3 py-1 rounded text-sm border transition-colors flex items-center space-x-1 ${
                showIndicators
                  ? 'bg-trading-blue/20 text-trading-blue border-trading-blue/30'
                  : 'bg-trading-bg text-trading-muted border-trading-border hover:border-trading-blue/50'
              }`}
            >
              <Activity className="w-3 h-3" />
              <span>Indicators</span>
            </button>
          </div>
        </div>

        {/* Chart */}
        <div className="p-6">
          <div className="h-96 bg-trading-bg rounded-lg border border-trading-border/50 p-4">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'area' ? (
                <AreaChart data={historicalData}>
                  <defs>
                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="time"
                    tickFormatter={formatTime}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                  />
                  <YAxis 
                    domain={['dataMin - 0.5', 'dataMax + 0.5']}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    tickFormatter={(value) => `$${value.toFixed(2)}`}
                  />
                  <Tooltip 
                    labelFormatter={(value) => formatTime(value as number)}
                    formatter={(value: number, name: string) => [
                      name === 'price' ? `$${value.toFixed(2)}` : value.toFixed(2),
                      name === 'price' ? 'Price' : name === 'ma20' ? 'MA20' : 'RSI'
                    ]}
                    contentStyle={{
                      backgroundColor: '#151821',
                      border: '1px solid #2a2d3a',
                      borderRadius: '8px',
                      color: '#e2e8f0',
                      fontSize: '12px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#22d3ee" 
                    strokeWidth={2}
                    fill="url(#priceGradient)"
                    dot={false}
                  />
                  {showIndicators && (
                    <Line 
                      type="monotone" 
                      dataKey="ma20" 
                      stroke="#f59e0b" 
                      strokeWidth={1}
                      dot={false}
                      strokeDasharray="3 3"
                    />
                  )}
                </AreaChart>
              ) : (
                <LineChart data={historicalData}>
                  <XAxis 
                    dataKey="time"
                    tickFormatter={formatTime}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                  />
                  <YAxis 
                    domain={['dataMin - 0.5', 'dataMax + 0.5']}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    tickFormatter={(value) => `$${value.toFixed(2)}`}
                  />
                  <Tooltip 
                    labelFormatter={(value) => formatTime(value as number)}
                    formatter={(value: number, name: string) => [
                      name === 'price' ? `$${value.toFixed(2)}` : value.toFixed(2),
                      name === 'price' ? 'Price' : name === 'ma20' ? 'MA20' : 'RSI'
                    ]}
                    contentStyle={{
                      backgroundColor: '#151821',
                      border: '1px solid #2a2d3a',
                      borderRadius: '8px',
                      color: '#e2e8f0',
                      fontSize: '12px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#22d3ee" 
                    strokeWidth={2}
                    dot={false}
                  />
                  {showIndicators && (
                    <Line 
                      type="monotone" 
                      dataKey="ma20" 
                      stroke="#f59e0b" 
                      strokeWidth={1}
                      dot={false}
                      strokeDasharray="3 3"
                    />
                  )}
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Technical Indicators */}
          {showIndicators && historicalData.length > 0 && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-trading-bg rounded-lg p-4">
                <h4 className="text-trading-text font-medium mb-2 flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-trading-cyan" />
                  <span>RSI (14)</span>
                </h4>
                <div className="text-2xl font-mono font-bold text-trading-text">
                  {historicalData[historicalData.length - 1]?.rsi.toFixed(0) || 50}
                </div>
                <div className={`text-sm ${
                  (historicalData[historicalData.length - 1]?.rsi || 50) > 70 ? 'text-trading-red' :
                  (historicalData[historicalData.length - 1]?.rsi || 50) < 30 ? 'text-trading-green' :
                  'text-trading-muted'
                }`}>
                  {(historicalData[historicalData.length - 1]?.rsi || 50) > 70 ? 'Overbought' :
                   (historicalData[historicalData.length - 1]?.rsi || 50) < 30 ? 'Oversold' : 'Neutral'}
                </div>
              </div>

              <div className="bg-trading-bg rounded-lg p-4">
                <h4 className="text-trading-text font-medium mb-2">Moving Average (20)</h4>
                <div className="text-2xl font-mono font-bold text-trading-text">
                  ${historicalData[historicalData.length - 1]?.ma20.toFixed(2) || '0.00'}
                </div>
                <div className={`text-sm ${
                  currentData.price > (historicalData[historicalData.length - 1]?.ma20 || 0) ? 'text-trading-green' : 'text-trading-red'
                }`}>
                  {currentData.price > (historicalData[historicalData.length - 1]?.ma20 || 0) ? 'Above MA' : 'Below MA'}
                </div>
              </div>

              <div className="bg-trading-bg rounded-lg p-4">
                <h4 className="text-trading-text font-medium mb-2">Volatility</h4>
                <div className="text-2xl font-mono font-bold text-trading-text">
                  {historicalData[historicalData.length - 1]?.volatility.toFixed(2) || '0.00'}%
                </div>
                <div className={`text-sm ${
                  (historicalData[historicalData.length - 1]?.volatility || 0) > 2 ? 'text-trading-red' :
                  (historicalData[historicalData.length - 1]?.volatility || 0) < 1 ? 'text-trading-green' :
                  'text-trading-yellow'
                }`}>
                  {(historicalData[historicalData.length - 1]?.volatility || 0) > 2 ? 'High' :
                   (historicalData[historicalData.length - 1]?.volatility || 0) < 1 ? 'Low' : 'Medium'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailedStockView;
