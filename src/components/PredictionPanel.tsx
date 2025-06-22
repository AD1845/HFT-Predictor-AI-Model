
import React, { useState, useEffect } from 'react';
import { Brain, Target, Clock, TrendingUp, AlertTriangle, Zap, Shield, Activity } from 'lucide-react';
import { PredictionSignal, strategies, generatePrediction, generateMarketData, marketAssets } from '../utils/hftData';

const PredictionPanel = () => {
  const [predictions, setPredictions] = useState<PredictionSignal[]>([]);
  const [activeStrategies, setActiveStrategies] = useState(strategies.filter(s => s.active));
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>('all');

  useEffect(() => {
    const generatePredictions = () => {
      const symbols = Object.keys(marketAssets).slice(0, 8);
      const newPredictions: PredictionSignal[] = [];

      symbols.forEach(symbol => {
        const asset = marketAssets[symbol as keyof typeof marketAssets];
        const marketData = generateMarketData(symbol, asset.basePrice);
        
        // Select appropriate strategy based on asset type
        let applicableStrategies = activeStrategies;
        if (asset.type === 'crypto') {
          applicableStrategies = activeStrategies.filter(s => 
            s.id === 'crypto_sentiment' || s.id === 'momentum_scalper' || s.id === 'orderbook_imbalance'
          );
        }
        
        const strategy = applicableStrategies[Math.floor(Math.random() * applicableStrategies.length)];
        
        if (strategy) {
          newPredictions.push(generatePrediction(marketData, strategy));
        }
      });

      setPredictions(newPredictions.slice(0, 6)); // Show top 6 predictions
    };

    generatePredictions();
    const interval = setInterval(generatePredictions, 4000);

    return () => clearInterval(interval);
  }, [activeStrategies]);

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'buy': return 'text-trading-green bg-trading-green/15 border-trading-green/30';
      case 'sell': return 'text-trading-red bg-trading-red/15 border-trading-red/30';
      default: return 'text-trading-yellow bg-trading-yellow/15 border-trading-yellow/30';
    }
  };

  const getSignalIcon = (signal: string) => {
    switch (signal) {
      case 'buy': return <TrendingUp className="w-4 h-4" />;
      case 'sell': return <TrendingUp className="w-4 h-4 rotate-180" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return <Shield className="w-3 h-3 text-trading-green" />;
      case 'medium': return <Activity className="w-3 h-3 text-trading-yellow" />;
      case 'high': return <Zap className="w-3 h-3 text-trading-red" />;
      default: return <Shield className="w-3 h-3 text-trading-muted" />;
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'text-trading-green';
      case 'medium': return 'text-trading-yellow';
      case 'high': return 'text-trading-red';
      default: return 'text-trading-muted';
    }
  };

  const filteredPredictions = selectedRiskLevel === 'all' 
    ? predictions 
    : predictions.filter(p => p.riskLevel === selectedRiskLevel);

  const riskLevels = [
    { key: 'all', label: 'All Risk' },
    { key: 'low', label: 'Low Risk' },
    { key: 'medium', label: 'Medium Risk' },
    { key: 'high', label: 'High Risk' }
  ];

  return (
    <div className="bg-trading-surface rounded-lg border border-trading-border p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Brain className="w-6 h-6 text-trading-purple" />
            <div className="absolute inset-0 animate-pulse-glow">
              <Brain className="w-6 h-6 text-trading-cyan opacity-30" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gradient-purple">AI Predictions</h2>
            <div className="text-xs text-trading-muted">
              {activeStrategies.length} strategies • {filteredPredictions.length} signals
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {riskLevels.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSelectedRiskLevel(key)}
              className={`px-2 py-1 rounded text-xs font-medium border transition-all duration-200 ${
                selectedRiskLevel === key
                  ? 'bg-trading-purple/20 text-trading-purple border-trading-purple/30'
                  : 'bg-trading-bg text-trading-muted border-trading-border hover:border-trading-purple/50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredPredictions.map((prediction, index) => {
          const asset = marketAssets[prediction.symbol as keyof typeof marketAssets];
          return (
            <div 
              key={`${prediction.symbol}-${index}`}
              className="bg-trading-bg rounded-lg p-4 border border-trading-border animate-slide-up hover:border-trading-purple/50 transition-all duration-300 group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-trading-text">{prediction.symbol}</span>
                    <div className={`px-2 py-0.5 rounded text-xs font-medium border opacity-60 ${
                      asset?.type === 'crypto' ? 'bg-trading-orange/10 text-trading-orange border-trading-orange/20' :
                      asset?.type === 'stock' ? 'bg-trading-blue/10 text-trading-blue border-trading-blue/20' :
                      'bg-trading-purple/10 text-trading-purple border-trading-purple/20'
                    }`}>
                      {asset?.type?.toUpperCase()}
                    </div>
                  </div>
                  <div className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center space-x-1.5 ${getSignalColor(prediction.signal)}`}>
                    {getSignalIcon(prediction.signal)}
                    <span className="uppercase tracking-wide">{prediction.signal}</span>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-xs text-trading-muted">Confidence</div>
                  <div className="font-mono text-lg font-bold text-trading-cyan">
                    {(prediction.confidence * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-3">
                <div>
                  <div className="text-xs text-trading-muted">Target Price</div>
                  <div className="font-mono text-sm font-medium text-trading-text">
                    ${prediction.targetPrice.toFixed(asset?.type === 'forex' ? 4 : 2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-trading-muted">Expected Return</div>
                  <div className={`font-mono text-sm font-medium ${prediction.expectedReturn > 0 ? 'text-trading-green' : 'text-trading-red'}`}>
                    {prediction.expectedReturn > 0 ? '+' : ''}{prediction.expectedReturn.toFixed(2)}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-trading-muted flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>Timeframe</span>
                  </div>
                  <div className="font-mono text-sm text-trading-text">
                    {prediction.timeframe}s
                  </div>
                </div>
                <div>
                  <div className="text-xs text-trading-muted">Risk Level</div>
                  <div className={`text-sm font-medium flex items-center space-x-1 ${getRiskColor(prediction.riskLevel)}`}>
                    {getRiskIcon(prediction.riskLevel)}
                    <span className="capitalize">{prediction.riskLevel}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-trading-border/50 pt-3">
                <div className="text-xs text-trading-muted mb-1">
                  Strategy: <span className="text-trading-cyan font-medium">{prediction.strategy}</span>
                </div>
                <div className="text-xs text-trading-muted leading-relaxed">
                  {prediction.reasoning}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredPredictions.length === 0 && (
        <div className="text-center py-8 text-trading-muted">
          <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <div>No predictions available for selected risk level</div>
        </div>
      )}
    </div>
  );
};

export default PredictionPanel;
