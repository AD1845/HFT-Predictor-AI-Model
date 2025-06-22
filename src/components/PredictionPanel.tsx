
import React, { useState, useEffect } from 'react';
import { Brain, Target, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import { PredictionSignal, strategies, generatePrediction, generateMarketData } from '../utils/hftData';

const PredictionPanel = () => {
  const [predictions, setPredictions] = useState<PredictionSignal[]>([]);
  const [activeStrategies, setActiveStrategies] = useState(strategies.filter(s => s.active));

  useEffect(() => {
    const generatePredictions = () => {
      const symbols = ['AAPL', 'GOOGL', 'TSLA', 'BTC/USD'];
      const newPredictions: PredictionSignal[] = [];

      symbols.forEach(symbol => {
        const marketData = generateMarketData(symbol, symbol === 'BTC/USD' ? 67500 : 200);
        const strategy = activeStrategies[Math.floor(Math.random() * activeStrategies.length)];
        
        if (strategy) {
          newPredictions.push(generatePrediction(marketData, strategy));
        }
      });

      setPredictions(newPredictions);
    };

    generatePredictions();
    const interval = setInterval(generatePredictions, 3000);

    return () => clearInterval(interval);
  }, [activeStrategies]);

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'buy': return 'text-trading-green bg-trading-green/10 border-trading-green/20';
      case 'sell': return 'text-trading-red bg-trading-red/10 border-trading-red/20';
      default: return 'text-trading-yellow bg-trading-yellow/10 border-trading-yellow/20';
    }
  };

  const getSignalIcon = (signal: string) => {
    switch (signal) {
      case 'buy': return <TrendingUp className="w-4 h-4" />;
      case 'sell': return <TrendingUp className="w-4 h-4 rotate-180" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-trading-surface rounded-lg border border-trading-border p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-trading-purple" />
          <h2 className="text-lg font-semibold text-gradient-purple">AI Predictions</h2>
        </div>
        <div className="text-xs text-trading-muted">
          {activeStrategies.length} strategies active
        </div>
      </div>

      <div className="space-y-3">
        {predictions.map((prediction, index) => (
          <div 
            key={`${prediction.symbol}-${index}`}
            className="bg-trading-bg rounded-lg p-3 border border-trading-border animate-slide-up"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-trading-text">{prediction.symbol}</span>
                <div className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center space-x-1 ${getSignalColor(prediction.signal)}`}>
                  {getSignalIcon(prediction.signal)}
                  <span className="uppercase">{prediction.signal}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-trading-muted">Confidence</div>
                <div className="font-mono text-sm font-medium text-trading-cyan">
                  {(prediction.confidence * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-4">
                <div>
                  <div className="text-xs text-trading-muted">Target</div>
                  <div className="font-mono text-sm text-trading-text">
                    ${prediction.targetPrice.toFixed(2)}
                  </div>
                </div>
                <div className="flex items-center space-x-1 text-xs text-trading-muted">
                  <Clock className="w-3 h-3" />
                  <span>{prediction.timeframe}s</span>
                </div>
              </div>
            </div>

            <div className="text-xs text-trading-muted mb-2">
              Strategy: <span className="text-trading-text">{prediction.strategy}</span>
            </div>

            <div className="text-xs text-trading-muted leading-relaxed">
              {prediction.reasoning}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PredictionPanel;
