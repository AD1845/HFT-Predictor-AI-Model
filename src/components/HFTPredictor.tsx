
import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Activity, Brain, Zap, Target, BarChart3, RefreshCw } from 'lucide-react';
import { useHFTPredictor } from '../hooks/useHFTPredictor';
import { Card } from './ui/card';
import { Button } from './ui/button';

const HFTPredictor = () => {
  const [selectedSymbols] = useState([
    'AAPL', 'GOOGL', 'MSFT', 'NVDA', 'META', 'TSLA', 
    'BTC/USD', 'ETH/USD', 'EUR/USD', 'GBP/USD'
  ]);
  
  const { 
    predictions, 
    loading, 
    error, 
    isTraining, 
    trainModel, 
    refetch 
  } = useHFTPredictor(selectedSymbols, 5000);

  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case 'BUY': return 'text-trading-green';
      case 'SELL': return 'text-trading-red';
      default: return 'text-trading-yellow';
    }
  };

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'BUY': return <TrendingUp className="w-4 h-4" />;
      case 'SELL': return <TrendingDown className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 70) return 'text-trading-green';
    if (confidence >= 50) return 'text-trading-yellow';
    return 'text-trading-red';
  };

  if (loading && predictions.length === 0) {
    return (
      <div className="bg-trading-surface rounded-lg border border-trading-border p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Brain className="w-6 h-6 text-trading-blue animate-pulse" />
          <h2 className="text-xl font-semibold text-trading-text">HFT Predictor</h2>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-trading-blue mx-auto mb-4"></div>
          <p className="text-trading-muted">Training AI model with live market data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-trading-surface rounded-lg border border-trading-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Brain className="w-6 h-6 text-trading-blue" />
            <Zap className="w-3 h-3 text-trading-yellow absolute -top-1 -right-1 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-trading-text">HFT AI Predictor</h2>
            <div className="text-sm text-trading-muted">
              Real-time predictions • {predictions.length} symbols • 5s updates
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            onClick={trainModel}
            disabled={isTraining}
            className="bg-trading-blue/20 text-trading-blue border-trading-blue/30 hover:bg-trading-blue/30"
          >
            {isTraining ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Training...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                Train Model
              </>
            )}
          </Button>
          
          <Button
            onClick={refetch}
            disabled={loading}
            className="bg-trading-cyan/20 text-trading-cyan border-trading-cyan/30 hover:bg-trading-cyan/30"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-trading-red/10 border border-trading-red/20 rounded-lg">
          <div className="text-trading-red text-sm">
            Error: {error}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {predictions.map((prediction) => (
          <Card key={prediction.symbol} className="bg-trading-bg border-trading-border hover:border-trading-blue/50 transition-all duration-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-trading-text">{prediction.symbol}</span>
                <div className={`flex items-center space-x-1 ${getDirectionColor(prediction.direction)}`}>
                  {getDirectionIcon(prediction.direction)}
                  <span className="text-xs font-medium">{prediction.direction}</span>
                </div>
              </div>
              <Target className="w-4 h-4 text-trading-cyan" />
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="text-xs text-trading-muted mb-1">Current → Predicted</div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-mono text-trading-text">
                    ${prediction.currentPrice.toFixed(4)}
                  </span>
                  <span className="text-lg font-mono text-trading-cyan">
                    ${prediction.predictedPrice.toFixed(4)}
                  </span>
                </div>
                <div className={`text-sm font-medium ${getDirectionColor(prediction.direction)}`}>
                  {prediction.direction === 'BUY' ? '+' : prediction.direction === 'SELL' ? '-' : ''}
                  {Math.abs(((prediction.predictedPrice - prediction.currentPrice) / prediction.currentPrice) * 100).toFixed(2)}%
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-trading-muted">Confidence</span>
                  <div className={`font-mono font-medium ${getConfidenceColor(prediction.confidence)}`}>
                    {prediction.confidence.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <span className="text-trading-muted">RSI</span>
                  <div className={`font-mono ${prediction.rsi > 70 ? 'text-trading-red' : prediction.rsi < 30 ? 'text-trading-green' : 'text-trading-text'}`}>
                    {prediction.rsi.toFixed(1)}
                  </div>
                </div>
                <div>
                  <span className="text-trading-muted">Volatility</span>
                  <div className="font-mono text-trading-text">
                    {(prediction.volatility * 100).toFixed(1)}%
                  </div>
                </div>
                <div>
                  <span className="text-trading-muted">Momentum</span>
                  <div className={`font-mono ${prediction.momentum > 0 ? 'text-trading-green' : 'text-trading-red'}`}>
                    {prediction.momentum.toFixed(1)}%
                  </div>
                </div>
              </div>
              
              <div className="pt-2 border-t border-trading-border/50">
                <div className="flex justify-between text-xs text-trading-muted">
                  <span>Support: ${prediction.support.toFixed(2)}</span>
                  <span>Resistance: ${prediction.resistance.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="text-xs text-trading-muted">
                Updated: {new Date(prediction.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      {predictions.length === 0 && !loading && (
        <div className="text-center py-8 text-trading-muted">
          No predictions available. Click "Train Model" to start.
        </div>
      )}
    </div>
  );
};

export default HFTPredictor;
