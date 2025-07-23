import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';
import { Activity, Zap, TrendingUp, Target, AlertCircle, Clock, DollarSign } from 'lucide-react';
import { useOptimizedHFTPredictor } from '../hooks/useOptimizedHFTPredictor';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

const OptimizedHFTDashboard = () => {
  const [symbols] = useState(['BTC/USD', 'ETH/USD', 'AAPL', 'TSLA', 'NVDA']);
  const [timeframe, setTimeframe] = useState('1m');
  
  const {
    predictions,
    pnlMetrics,
    loading,
    isLiveTrading,
    toggleLiveTrading
  } = useOptimizedHFTPredictor(symbols, 100);

  // Generate price chart data
  const [priceHistory] = React.useState(() => {
    const data = [];
    let basePrice = 43000;
    for (let i = 100; i >= 0; i--) {
      const change = (Math.random() - 0.5) * 200;
      basePrice += change;
      data.push({
        time: new Date(Date.now() - i * 60000).toLocaleTimeString(),
        price: basePrice,
        prediction: basePrice + (Math.random() - 0.5) * 100,
        volume: Math.random() * 1000 + 500
      });
    }
    return data;
  });

  const avgLatency = predictions.length > 0 
    ? predictions.reduce((sum, p) => sum + p.latency_ms, 0) / predictions.length 
    : 0;

  const totalSignalStrength = predictions.reduce((sum, p) => sum + Math.abs(p.signal_strength), 0);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-trading-surface border-trading-border p-4">
          <div className="flex items-center space-x-2 mb-1">
            <Clock className="w-4 h-4 text-trading-blue" />
            <span className="text-xs text-trading-muted">Avg Latency</span>
          </div>
          <div className={`text-xl font-mono font-bold ${
            avgLatency < 5 ? 'text-trading-green' : 
            avgLatency < 10 ? 'text-trading-yellow' : 'text-trading-red'
          }`}>
            {avgLatency.toFixed(1)}ms
          </div>
        </Card>

        <Card className="bg-trading-surface border-trading-border p-4">
          <div className="flex items-center space-x-2 mb-1">
            <DollarSign className="w-4 h-4 text-trading-green" />
            <span className="text-xs text-trading-muted">Total P&L</span>
          </div>
          <div className={`text-xl font-mono font-bold ${
            pnlMetrics.total_pnl >= 0 ? 'text-trading-green' : 'text-trading-red'
          }`}>
            ${pnlMetrics.total_pnl.toFixed(0)}
          </div>
        </Card>

        <Card className="bg-trading-surface border-trading-border p-4">
          <div className="flex items-center space-x-2 mb-1">
            <Target className="w-4 h-4 text-trading-cyan" />
            <span className="text-xs text-trading-muted">Win Rate</span>
          </div>
          <div className="text-xl font-mono font-bold text-trading-cyan">
            {pnlMetrics.win_rate.toFixed(1)}%
          </div>
        </Card>

        <Card className="bg-trading-surface border-trading-border p-4">
          <div className="flex items-center space-x-2 mb-1">
            <Activity className="w-4 h-4 text-trading-purple" />
            <span className="text-xs text-trading-muted">Sharpe Ratio</span>
          </div>
          <div className="text-xl font-mono font-bold text-trading-purple">
            {pnlMetrics.sharpe_ratio.toFixed(2)}
          </div>
        </Card>

        <Card className="bg-trading-surface border-trading-border p-4">
          <div className="flex items-center space-x-2 mb-1">
            <Zap className="w-4 h-4 text-trading-yellow" />
            <span className="text-xs text-trading-muted">Signal Strength</span>
          </div>
          <div className="text-xl font-mono font-bold text-trading-yellow">
            {totalSignalStrength.toFixed(2)}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-time Price Chart */}
        <Card className="bg-trading-surface border-trading-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-trading-text">Real-time Price & Predictions</h3>
            <div className="flex space-x-2">
              {['1m', '5m', '15m'].map((tf) => (
                <Button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 text-xs ${
                    timeframe === tf
                      ? 'bg-trading-blue/20 text-trading-blue border-trading-blue/30'
                      : 'bg-trading-bg text-trading-muted border-trading-border hover:border-trading-blue/50'
                  }`}
                >
                  {tf}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={priceHistory}>
                <XAxis 
                  dataKey="time"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  domain={['dataMin - 100', 'dataMax + 100']}
                />
                <Tooltip 
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
                  stroke="#00d4aa" 
                  strokeWidth={2}
                  dot={false}
                  name="Price"
                />
                <Line 
                  type="monotone" 
                  dataKey="prediction" 
                  stroke="#4dabf7" 
                  strokeWidth={1}
                  strokeDasharray="5 3"
                  dot={false}
                  name="Prediction"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Live Predictions Grid */}
        <Card className="bg-trading-surface border-trading-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-trading-text">Live Predictions</h3>
            <Button
              onClick={toggleLiveTrading}
              className={`${
                isLiveTrading 
                  ? 'bg-trading-red/20 text-trading-red border-trading-red/30' 
                  : 'bg-trading-green/20 text-trading-green border-trading-green/30'
              }`}
            >
              {isLiveTrading ? 'Stop' : 'Start'} Trading
            </Button>
          </div>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {predictions.map((prediction) => (
              <div key={prediction.symbol} className="bg-trading-bg rounded-lg p-3 border border-trading-border/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-trading-text text-sm">{prediction.symbol}</span>
                    <Badge 
                      variant={prediction.direction === 'BUY' ? 'default' : prediction.direction === 'SELL' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {prediction.direction}
                    </Badge>
                  </div>
                  <Badge variant="outline" className="text-xs font-mono">
                    {prediction.latency_ms.toFixed(1)}ms
                  </Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-trading-muted">Price</span>
                    <div className="font-mono text-trading-text">${prediction.currentPrice.toFixed(2)}</div>
                  </div>
                  <div>
                    <span className="text-trading-muted">Confidence</span>
                    <div className={`font-mono ${
                      prediction.confidence > 70 ? 'text-trading-green' : 
                      prediction.confidence > 50 ? 'text-trading-yellow' : 'text-trading-red'
                    }`}>
                      {prediction.confidence.toFixed(0)}%
                    </div>
                  </div>
                  <div>
                    <span className="text-trading-muted">Signal</span>
                    <div className="font-mono text-trading-purple">
                      {prediction.signal_strength.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {predictions.length === 0 && (
            <div className="text-center py-8 text-trading-muted">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <div>No live predictions</div>
              <div className="text-xs">Start trading to see predictions</div>
            </div>
          )}
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card className="bg-trading-surface border-trading-border p-6">
        <h3 className="text-lg font-semibold text-trading-text mb-4">Performance Metrics</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-trading-green mb-1">
              {pnlMetrics.win_rate.toFixed(1)}%
            </div>
            <div className="text-sm text-trading-muted">Win Rate</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-trading-purple mb-1">
              {pnlMetrics.sharpe_ratio.toFixed(2)}
            </div>
            <div className="text-sm text-trading-muted">Sharpe Ratio</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-trading-red mb-1">
              {pnlMetrics.max_drawdown.toFixed(1)}%
            </div>
            <div className="text-sm text-trading-muted">Max Drawdown</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-trading-yellow mb-1">
              {pnlMetrics.profit_factor.toFixed(2)}
            </div>
            <div className="text-sm text-trading-muted">Profit Factor</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default OptimizedHFTDashboard;