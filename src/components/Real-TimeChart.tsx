import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, AreaChart, Area } from 'recharts';
import { generatePriceHistory, marketAssets } from '../utils/hftData';
import { BarChart3, TrendingUp, Activity, Zap } from 'lucide-react';

interface ChartData {
  time: number;
  price: number;
  volume: number;
  high: number;
  low: number;
  close: number;
}

const RealTimeChart = () => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState('BTC/USD');
  const [chartType, setChartType] = useState<'line' | 'area'>('area');
  const [timeframe, setTimeframe] = useState('1m');

  useEffect(() => {
    const asset = marketAssets[selectedSymbol as keyof typeof marketAssets];
    // Initialize chart data
    const initialData = generatePriceHistory(asset.basePrice, 60);
    setChartData(initialData);

    // Update chart data every second
    const interval = setInterval(() => {
      setChartData(prevData => {
        const newData = [...prevData];
        const lastPrice = newData[newData.length - 1].price;
        const volatilityMultiplier = asset.type === 'crypto' ? 0.002 : 0.001;
        const change = (Math.random() - 0.5) * 2 * volatilityMultiplier * lastPrice;
        const newPrice = lastPrice + change;
        
        newData.push({
          time: Date.now(),
          price: newPrice,
          volume: Math.floor(Math.random() * 8000) + 1000,
          high: newPrice * (1 + Math.random() * 0.0005),
          low: newPrice * (1 - Math.random() * 0.0005),
          close: newPrice
        });

        // Keep only last 60 data points
        return newData.slice(-60);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedSymbol]);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const currentPrice = chartData.length > 0 ? chartData[chartData.length - 1].price : 0;
  const priceChange = chartData.length >= 2 
    ? chartData[chartData.length - 1].price - chartData[chartData.length - 2].price 
    : 0;
  const priceChangePercent = chartData.length >= 2 
    ? ((chartData[chartData.length - 1].price - chartData[0].price) / chartData[0].price) * 100
    : 0;

  // Get symbols by category for better organization
  const getSymbolsByCategory = () => {
    const entries = Object.entries(marketAssets);
    const categories = {
      'Crypto': entries.filter(([_, asset]) => asset.type === 'crypto').slice(0, 6),
      'Stocks': entries.filter(([_, asset]) => asset.type === 'stock').slice(0, 6),
      'Forex': entries.filter(([_, asset]) => asset.type === 'forex'),
      'Commodities': entries.filter(([_, asset]) => asset.type === 'commodity')
    };
    return categories;
  };

  const symbolCategories = getSymbolsByCategory();
  const asset = marketAssets[selectedSymbol as keyof typeof marketAssets];

  return (
    <div className="bg-trading-surface rounded-lg border border-trading-border p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <BarChart3 className="w-6 h-6 text-trading-cyan" />
            <div className="absolute inset-0 animate-pulse-glow">
              <Activity className="w-6 h-6 text-trading-blue opacity-40" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-trading-text">Real-Time Price Chart</h2>
            <div className="text-xs text-trading-muted">Live market data • 1-second updates</div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-1.5 rounded text-xs font-medium border transition-all duration-200 ${
                chartType === 'line'
                  ? 'bg-trading-cyan/20 text-trading-cyan border-trading-cyan/30'
                  : 'bg-trading-bg text-trading-muted border-trading-border hover:border-trading-cyan/50'
              }`}
            >
              Line
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`px-3 py-1.5 rounded text-xs font-medium border transition-all duration-200 ${
                chartType === 'area'
                  ? 'bg-trading-cyan/20 text-trading-cyan border-trading-cyan/30'
                  : 'bg-trading-bg text-trading-muted border-trading-border hover:border-trading-cyan/50'
              }`}
            >
              Area
            </button>
          </div>
          
          <select 
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            className="bg-trading-bg border border-trading-border rounded-lg px-3 py-2 text-sm text-trading-text focus:border-trading-cyan focus:outline-none"
          >
            {Object.entries(symbolCategories).map(([category, symbols]) => (
              <optgroup key={category} label={category}>
                {symbols.map(([symbol, _]) => (
                  <option key={symbol} value={symbol}>{symbol}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div>
              <div className="text-3xl font-mono font-bold text-trading-text">
                ${currentPrice.toFixed(asset?.type === 'forex' ? 4 : selectedSymbol.includes('USD') && asset?.type === 'crypto' ? 0 : 2)}
              </div>
              <div className={`text-sm font-mono flex items-center space-x-2 ${priceChange >= 0 ? 'text-trading-green' : 'text-trading-red'}`}>
                <span>
                  {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(4)}
                </span>
                <span>
                  ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(3)}%)
                </span>
                {priceChange >= 0 ? 
                  <TrendingUp className="w-4 h-4" /> : 
                  <TrendingUp className="w-4 h-4 rotate-180" />
                }
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-trading-muted">
              <div className={`px-3 py-1 rounded border ${
                asset?.type === 'crypto' ? 'bg-trading-orange/10 text-trading-orange border-trading-orange/20' :
                asset?.type === 'stock' ? 'bg-trading-blue/10 text-trading-blue border-trading-blue/20' :
                asset?.type === 'forex' ? 'bg-trading-purple/10 text-trading-purple border-trading-purple/20' :
                'bg-trading-yellow/10 text-trading-yellow border-trading-yellow/20'
              }`}>
                <div className="flex items-center space-x-1">
                  <Zap className="w-3 h-3" />
                  <span className="font-medium">{asset?.type?.toUpperCase()}</span>
                </div>
              </div>
              
              {chartData.length > 0 && (
                <div>
                  <span className="text-trading-muted">Volume: </span>
                  <span className="font-mono text-trading-cyan">
                    {(chartData[chartData.length - 1].volume / 1000).toFixed(1)}K
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-xs text-trading-muted">Market Status</div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-trading-green rounded-full animate-pulse"></div>
              <span className="text-trading-green font-medium">Live</span>
            </div>
          </div>
        </div>
      </div>

      <div className="h-80 bg-trading-bg rounded-lg border border-trading-border/50 p-4">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={chartData}>
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
                interval="preserveStartEnd"
              />
              <YAxis 
                domain={['dataMin - 0.5', 'dataMax + 0.5']}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickFormatter={(value) => `$${value.toFixed(asset?.type === 'forex' ? 4 : 2)}`}
              />
              <Tooltip 
                labelFormatter={(value) => formatTime(value as number)}
                formatter={(value: number) => [
                  `$${value.toFixed(asset?.type === 'forex' ? 4 : selectedSymbol.includes('USD') && asset?.type === 'crypto' ? 0 : 2)}`, 
                  'Price'
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
            </AreaChart>
          ) : (
            <LineChart data={chartData}>
              <XAxis 
                dataKey="time"
                tickFormatter={formatTime}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#64748b' }}
                interval="preserveStartEnd"
              />
              <YAxis 
                domain={['dataMin - 0.5', 'dataMax + 0.5']}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickFormatter={(value) => `$${value.toFixed(asset?.type === 'forex' ? 4 : 2)}`}
              />
              <Tooltip 
                labelFormatter={(value) => formatTime(value as number)}
                formatter={(value: number) => [
                  `$${value.toFixed(asset?.type === 'forex' ? 4 : selectedSymbol.includes('USD') && asset?.type === 'crypto' ? 0 : 2)}`, 
                  'Price'
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
                strokeWidth={2.5}
                dot={false}
                strokeDasharray="0"
                filter="drop-shadow(0px 0px 6px rgba(34, 211, 238, 0.4))"
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RealTimeChart;
