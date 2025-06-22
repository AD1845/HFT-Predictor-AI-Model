
import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line } from 'recharts';
import { Wallet, TrendingUp, Target, DollarSign, Activity, PieChart as PieChartIcon } from 'lucide-react';

interface PortfolioData {
  totalValue: number;
  dailyPnL: number;
  weeklyPnL: number;
  monthlyPnL: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
}

interface AssetAllocation {
  symbol: string;
  value: number;
  percentage: number;
  pnl: number;
  color: string;
}

interface PerformanceMetric {
  name: string;
  value: string;
  change: number;
  icon: React.ComponentType<any>;
  color: string;
}

const PortfolioAnalytics = () => {
  const [portfolioData, setPortfolioData] = useState<PortfolioData>({
    totalValue: 125847.52,
    dailyPnL: 1284.67,
    weeklyPnL: 3847.23,
    monthlyPnL: 12847.52,
    sharpeRatio: 2.34,
    maxDrawdown: -5.67,
    winRate: 68.4,
    avgWin: 145.30,
    avgLoss: -89.45
  });

  const [assetAllocation, setAssetAllocation] = useState<AssetAllocation[]>([
    { symbol: 'BTC/USD', value: 45230.15, percentage: 35.9, pnl: 2847.30, color: '#ff922b' },
    { symbol: 'ETH/USD', value: 32145.80, percentage: 25.5, pnl: 1456.20, color: '#4dabf7' },
    { symbol: 'AAPL', value: 18670.25, percentage: 14.8, pnl: 567.80, color: '#00d4aa' },
    { symbol: 'TSLA', value: 15420.10, percentage: 12.2, pnl: -234.50, color: '#ff6b6b' },
    { symbol: 'GOOGL', value: 8890.45, percentage: 7.1, pnl: 789.45, color: '#9775fa' },
    { symbol: 'Others', value: 5490.77, percentage: 4.4, pnl: 125.67, color: '#ffd43b' }
  ]);

  const [performanceHistory, setPerformanceHistory] = useState<any[]>([]);

  useEffect(() => {
    // Generate performance history
    const history = [];
    let baseValue = 100000;
    
    for (let i = 30; i >= 0; i--) {
      const change = (Math.random() - 0.48) * 2000; // Slight positive bias
      baseValue += change;
      history.push({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString(),
        value: baseValue,
        pnl: change
      });
    }
    
    setPerformanceHistory(history);
  }, []);

  const performanceMetrics: PerformanceMetric[] = [
    {
      name: 'Total Portfolio',
      value: `$${portfolioData.totalValue.toLocaleString()}`,
      change: 2.34,
      icon: Wallet,
      color: 'text-trading-cyan'
    },
    {
      name: 'Daily P&L',
      value: `$${portfolioData.dailyPnL.toLocaleString()}`,
      change: 1.67,
      icon: TrendingUp,
      color: 'text-trading-green'
    },
    {
      name: 'Win Rate',
      value: `${portfolioData.winRate}%`,
      change: 2.1,
      icon: Target,
      color: 'text-trading-purple'
    },
    {
      name: 'Sharpe Ratio',
      value: portfolioData.sharpeRatio.toFixed(2),
      change: 0.23,
      icon: Activity,
      color: 'text-trading-yellow'
    }
  ];

  const COLORS = ['#ff922b', '#4dabf7', '#00d4aa', '#ff6b6b', '#9775fa', '#ffd43b'];

  return (
    <div className="space-y-6">
      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {performanceMetrics.map((metric, index) => {
          const IconComponent = metric.icon;
          return (
            <div key={index} className="bg-trading-surface rounded-lg border border-trading-border p-4">
              <div className="flex items-center justify-between mb-2">
                <IconComponent className={`w-5 h-5 ${metric.color}`} />
                <div className={`text-xs px-2 py-1 rounded ${
                  metric.change >= 0 ? 'bg-trading-green/20 text-trading-green' : 'bg-trading-red/20 text-trading-red'
                }`}>
                  {metric.change >= 0 ? '+' : ''}{metric.change}%
                </div>
              </div>
              <div className="text-sm text-trading-muted">{metric.name}</div>
              <div className="text-xl font-bold text-trading-text font-mono">{metric.value}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Asset Allocation */}
        <div className="bg-trading-surface rounded-lg border border-trading-border p-5">
          <div className="flex items-center space-x-3 mb-4">
            <PieChartIcon className="w-5 h-5 text-trading-orange" />
            <h3 className="text-lg font-semibold text-trading-text">Asset Allocation</h3>
          </div>
          
          <div className="flex flex-col lg:flex-row items-center space-y-4 lg:space-y-0">
            <div className="w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assetAllocation}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="percentage"
                  >
                    {assetAllocation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex-1 space-y-2">
              {assetAllocation.map((asset, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-trading-bg rounded border border-trading-border/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: asset.color }}></div>
                    <span className="font-medium text-trading-text">{asset.symbol}</span>
                    <span className="text-sm text-trading-muted">{asset.percentage}%</span>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm text-trading-text">${asset.value.toLocaleString()}</div>
                    <div className={`text-xs ${asset.pnl >= 0 ? 'text-trading-green' : 'text-trading-red'}`}>
                      {asset.pnl >= 0 ? '+' : ''}${asset.pnl.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Chart */}
        <div className="bg-trading-surface rounded-lg border border-trading-border p-5">
          <div className="flex items-center space-x-3 mb-4">
            <TrendingUp className="w-5 h-5 text-trading-green" />
            <h3 className="text-lg font-semibold text-trading-text">30-Day Performance</h3>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceHistory}>
                <XAxis 
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Portfolio Value']}
                  contentStyle={{
                    backgroundColor: '#151821',
                    border: '1px solid #2a2d3a',
                    borderRadius: '8px',
                    color: '#e2e8f0'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#00d4aa" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="bg-trading-surface rounded-lg border border-trading-border p-5">
        <h3 className="text-lg font-semibold text-trading-text mb-4">Detailed Performance Metrics</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <h4 className="text-trading-muted font-medium">P&L Analysis</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-trading-muted">Daily P&L:</span>
                <span className="font-mono text-trading-green">+${portfolioData.dailyPnL.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-trading-muted">Weekly P&L:</span>
                <span className="font-mono text-trading-green">+${portfolioData.weeklyPnL.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-trading-muted">Monthly P&L:</span>
                <span className="font-mono text-trading-green">+${portfolioData.monthlyPnL.toLocaleString()}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="text-trading-muted font-medium">Risk Metrics</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-trading-muted">Sharpe Ratio:</span>
                <span className="font-mono text-trading-cyan">{portfolioData.sharpeRatio}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-trading-muted">Max Drawdown:</span>
                <span className="font-mono text-trading-red">{portfolioData.maxDrawdown}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-trading-muted">Win Rate:</span>
                <span className="font-mono text-trading-purple">{portfolioData.winRate}%</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="text-trading-muted font-medium">Trade Analysis</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-trading-muted">Avg Win:</span>
                <span className="font-mono text-trading-green">+${portfolioData.avgWin}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-trading-muted">Avg Loss:</span>
                <span className="font-mono text-trading-red">${portfolioData.avgLoss}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-trading-muted">Profit Factor:</span>
                <span className="font-mono text-trading-yellow">{(Math.abs(portfolioData.avgWin / portfolioData.avgLoss)).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioAnalytics;
