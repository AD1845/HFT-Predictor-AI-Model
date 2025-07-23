import React, { useState } from 'react';
import { Play, Pause, Settings, TrendingUp, AlertTriangle, DollarSign, Target, Activity, Zap } from 'lucide-react';
import { useOptimizedHFTPredictor } from '../hooks/useOptimizedHFTPredictor';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

const LiveTradingPanel = () => {
  const [symbols] = useState(['BTC/USD', 'ETH/USD', 'AAPL', 'TSLA', 'NVDA', 'GOOGL']);
  const [throttleMs, setThrottleMs] = useState(100);
  
  const {
    predictions,
    backtestResults,
    pnlMetrics,
    loading,
    error,
    isLiveTrading,
    riskManagement,
    runBacktest,
    toggleLiveTrading,
    setRiskManagement
  } = useOptimizedHFTPredictor(symbols, throttleMs);

  const avgLatency = predictions.length > 0 
    ? predictions.reduce((sum, p) => sum + p.latency_ms, 0) / predictions.length 
    : 0;

  const getLatencyColor = (latency: number) => {
    if (latency < 5) return 'text-trading-green';
    if (latency < 10) return 'text-trading-yellow';
    return 'text-trading-red';
  };

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'BUY': return <TrendingUp className="w-3 h-3" />;
      case 'SELL': return <Activity className="w-3 h-3 rotate-180" />;
      default: return <Activity className="w-3 h-3" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card className="bg-trading-surface border-trading-border p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Zap className="w-6 h-6 text-trading-purple" />
              {isLiveTrading && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-trading-green rounded-full animate-pulse" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-trading-text">Live Trading Engine</h2>
              <div className="text-sm text-trading-muted">
                Ultra-low latency • {throttleMs}ms intervals • {symbols.length} symbols
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Badge variant={avgLatency < 10 ? "default" : "destructive"} className="font-mono">
              {avgLatency.toFixed(1)}ms avg
            </Badge>
            <Button
              onClick={toggleLiveTrading}
              className={`${
                isLiveTrading 
                  ? 'bg-trading-red/20 text-trading-red border-trading-red/30 hover:bg-trading-red/30' 
                  : 'bg-trading-green/20 text-trading-green border-trading-green/30 hover:bg-trading-green/30'
              }`}
            >
              {isLiveTrading ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Stop Trading
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Trading
                </>
              )}
            </Button>
            <Button
              onClick={() => runBacktest(30)}
              disabled={loading}
              className="bg-trading-blue/20 text-trading-blue border-trading-blue/30 hover:bg-trading-blue/30"
            >
              Run Backtest
            </Button>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-trading-bg rounded-lg p-3 border border-trading-border/50">
            <div className="flex items-center space-x-2 mb-1">
              <DollarSign className="w-4 h-4 text-trading-green" />
              <span className="text-xs text-trading-muted">Total P&L</span>
            </div>
            <div className={`text-lg font-mono font-bold ${
              pnlMetrics.total_pnl >= 0 ? 'text-trading-green' : 'text-trading-red'
            }`}>
              ${pnlMetrics.total_pnl.toFixed(2)}
            </div>
          </div>
          
          <div className="bg-trading-bg rounded-lg p-3 border border-trading-border/50">
            <div className="flex items-center space-x-2 mb-1">
              <Target className="w-4 h-4 text-trading-cyan" />
              <span className="text-xs text-trading-muted">Win Rate</span>
            </div>
            <div className="text-lg font-mono font-bold text-trading-cyan">
              {pnlMetrics.win_rate.toFixed(1)}%
            </div>
          </div>
          
          <div className="bg-trading-bg rounded-lg p-3 border border-trading-border/50">
            <div className="flex items-center space-x-2 mb-1">
              <Activity className="w-4 h-4 text-trading-purple" />
              <span className="text-xs text-trading-muted">Sharpe Ratio</span>
            </div>
            <div className="text-lg font-mono font-bold text-trading-purple">
              {pnlMetrics.sharpe_ratio.toFixed(2)}
            </div>
          </div>
          
          <div className="bg-trading-bg rounded-lg p-3 border border-trading-border/50">
            <div className="flex items-center space-x-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-trading-red" />
              <span className="text-xs text-trading-muted">Max Drawdown</span>
            </div>
            <div className="text-lg font-mono font-bold text-trading-red">
              {pnlMetrics.max_drawdown.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Risk Management */}
        <div className="bg-trading-bg rounded-lg p-4 border border-trading-border/50">
          <div className="flex items-center space-x-2 mb-3">
            <Settings className="w-4 h-4 text-trading-yellow" />
            <span className="font-medium text-trading-text">Risk Management</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-trading-muted">Max Position</span>
              <div className="font-mono text-trading-text">${riskManagement.maxPositionSize}</div>
            </div>
            <div>
              <span className="text-trading-muted">Stop Loss</span>
              <div className="font-mono text-trading-text">{riskManagement.stopLoss}%</div>
            </div>
            <div>
              <span className="text-trading-muted">Daily Limit</span>
              <div className="font-mono text-trading-text">${riskManagement.dailyLossLimit}</div>
            </div>
            <div>
              <span className="text-trading-muted">Min Accuracy</span>
              <div className="font-mono text-trading-text">{riskManagement.accuracyThreshold}%</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Live Predictions */}
      <Card className="bg-trading-surface border-trading-border p-6">
        <h3 className="text-lg font-semibold text-trading-text mb-4">Live Predictions</h3>
        
        {error && (
          <div className="mb-4 p-3 bg-trading-red/10 border border-trading-red/20 rounded-lg text-trading-red text-sm">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {predictions.map((prediction) => (
            <div key={prediction.symbol} className="bg-trading-bg rounded-lg p-4 border border-trading-border/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-trading-text">{prediction.symbol}</span>
                  <div className={`flex items-center space-x-1 ${
                    prediction.direction === 'BUY' ? 'text-trading-green' : 
                    prediction.direction === 'SELL' ? 'text-trading-red' : 'text-trading-yellow'
                  }`}>
                    {getDirectionIcon(prediction.direction)}
                    <span className="text-xs font-medium">{prediction.direction}</span>
                  </div>
                </div>
                <Badge 
                  variant="outline" 
                  className={`font-mono text-xs ${getLatencyColor(prediction.latency_ms)}`}
                >
                  {prediction.latency_ms.toFixed(1)}ms
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-trading-muted">Price</span>
                  <span className="font-mono text-trading-text">${prediction.currentPrice.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-trading-muted">Prediction</span>
                  <span className="font-mono text-trading-cyan">${prediction.predictedPrice.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-trading-muted">Confidence</span>
                  <span className={`font-mono ${
                    prediction.confidence > 70 ? 'text-trading-green' : 
                    prediction.confidence > 50 ? 'text-trading-yellow' : 'text-trading-red'
                  }`}>
                    {prediction.confidence.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-trading-muted">Signal</span>
                  <span className="font-mono text-trading-purple">
                    {prediction.signal_strength.toFixed(3)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {predictions.length === 0 && !loading && (
          <div className="text-center py-8 text-trading-muted">
            No live predictions available. Start trading to see predictions.
          </div>
        )}
      </Card>

      {/* Backtest Results */}
      {backtestResults.length > 0 && (
        <Card className="bg-trading-surface border-trading-border p-6">
          <h3 className="text-lg font-semibold text-trading-text mb-4">Backtest Results</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {backtestResults.map((result) => (
              <div key={result.symbol} className="bg-trading-bg rounded-lg p-4 border border-trading-border/50">
                <div className="font-bold text-trading-text mb-3">{result.symbol}</div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-trading-muted">Total Trades</span>
                    <span className="text-trading-text">{result.total_trades}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-trading-muted">Win Rate</span>
                    <span className="text-trading-cyan">{result.win_rate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-trading-muted">Total P&L</span>
                    <span className={result.total_pnl >= 0 ? 'text-trading-green' : 'text-trading-red'}>
                      ${result.total_pnl.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-trading-muted">Sharpe Ratio</span>
                    <span className="text-trading-purple">{result.sharpe_ratio.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-trading-muted">Max Drawdown</span>
                    <span className="text-trading-red">{result.max_drawdown.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default LiveTradingPanel;