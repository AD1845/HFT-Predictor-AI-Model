import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { generatePriceHistory } from '../utils/hftData';
import { BarChart3 } from 'lucide-react';

interface ChartData {
  time: number;
  price: number;
  volume: number;
}

const RealTimeChart = () => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');

  const symbols = {
    'AAPL': 185.50,
    'GOOGL': 142.30,
    'TSLA': 248.75,
    'BTC/USD': 67500
  };

  useEffect(() => {
    // Initialize chart data
    const initialData = generatePriceHistory(symbols[selectedSymbol as keyof typeof symbols], 50);
    setChartData(initialData);

    // Update chart data every second
    const interval = setInterval(() => {
      setChartData(prevData => {
        const newData = [...prevData];
        const lastPrice = newData[newData.length - 1].price;
        const volatility = 0.001;
        const change = (Math.random() - 0.5) * 2 * volatility * lastPrice;
        
        newData.push({
          time: Date.now(),
          price: lastPrice + change,
          volume: Math.floor(Math.random() * 5000) + 1000
        });

        // Keep only last 50 data points
        return newData.slice(-50);
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

  return (
    <div className="bg-trading-surface rounded-lg border border-trading-border p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-trading-cyan" />
          <h2 className="text-lg font-semibold text-trading-text">Real-Time Price Chart</h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <select 
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            className="bg-trading-bg border border-trading-border rounded px-2 py-1 text-sm text-trading-text"
          >
            {Object.keys(symbols).map(symbol => (
              <option key={symbol} value={symbol}>{symbol}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center space-x-4">
          <div>
            <div className="text-2xl font-mono font-bold text-trading-text">
              ${currentPrice.toFixed(selectedSymbol.includes('USD') ? 0 : 2)}
            </div>
            <div className={`text-sm font-mono ${priceChange >= 0 ? 'text-trading-green' : 'text-trading-red'}`}>
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(4)} 
              ({((priceChange / currentPrice) * 100).toFixed(3)}%)
            </div>
          </div>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis 
              dataKey="time"
              tickFormatter={formatTime}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#64748b' }}
            />
            <YAxis 
              domain={['dataMin - 0.1', 'dataMax + 0.1']}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#64748b' }}
            />
            <Tooltip 
              labelFormatter={(value) => formatTime(value as number)}
              formatter={(value: number) => [
                `$${value.toFixed(selectedSymbol.includes('USD') ? 0 : 2)}`, 
                'Price'
              ]}
              contentStyle={{
                backgroundColor: '#151821',
                border: '1px solid #2a2d3a',
                borderRadius: '8px',
                color: '#e2e8f0'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#22d3ee" 
              strokeWidth={2}
              dot={false}
              strokeDasharray="0"
              className="drop-shadow-lg"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RealTimeChart;
