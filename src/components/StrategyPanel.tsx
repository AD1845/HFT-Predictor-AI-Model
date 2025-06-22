
import React, { useState } from 'react';
import { Settings, BarChart3, Activity, Play, Pause, Shield, Zap, Target, TrendingUp } from 'lucide-react';
import { strategies } from '../utils/hftData';

const StrategyPanel = () => {
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [filterByRisk, setFilterByRisk] = useState<string>('all');

  const filteredStrategies = filterByRisk === 'all' 
    ? strategies 
    : strategies.filter(s => s.riskLevel === filterByRisk);

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return <Shield className="w-4 h-4 text-trading-green" />;
      case 'medium': return <Activity className="w-4 h-4 text-trading-yellow" />;
      case 'high': return <Zap className="w-4 h-4 text-trading-red" />;
      default: return <Shield className="w-4 h-4 text-trading-muted" />;
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'text-trading-green bg-trading-green/10 border-trading-green/20';
      case 'medium': return 'text-trading-yellow bg-trading-yellow/10 border-trading-yellow/20';
      case 'high': return 'text-trading-red bg-trading-red/10 border-trading-red/20';
      default: return 'text-trading-muted bg-trading-muted/10 border-trading-muted/20';
    }
  };

  const totalPerformance = strategies.reduce((acc, s) => acc + (s.active ? s.performance : 0), 0);
  const activeCount = strategies.filter(s => s.active).length;
  const avgWinRate = strategies.reduce((acc, s) => acc + (s.active ? s.winRate : 0), 0) / activeCount || 0;

  const riskFilters = [
    { key: 'all', label: 'All Strategies' },
    { key: 'low', label: 'Low Risk' },
    { key: 'medium', label: 'Medium Risk' },
    { key: 'high', label: 'High Risk' }
  ];

  return (
    <div className="bg-trading-surface rounded-lg border border-trading-border p-5">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Settings className="w-6 h-6 text-trading-blue" />
            <div className="absolute inset-0 animate-pulse-glow">
              <Target className="w-6 h-6 text-trading-purple opacity-40" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-trading-text">Trading Strategies</h2>
            <div className="text-sm text-trading-muted">
              {activeCount} active • {strategies.length} total strategies
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-xs text-trading-muted">Total Performance</div>
            <div className="text-lg font-bold text-trading-green">+{totalPerformance.toFixed(1)}%</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-trading-muted">Avg Win Rate</div>
            <div className="text-lg font-bold text-trading-cyan">{avgWinRate.toFixed(1)}%</div>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2 mb-5">
        {riskFilters.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilterByRisk(key)}
            className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all duration-200 ${
              filterByRisk === key
                ? 'bg-trading-blue/20 text-trading-blue border-trading-blue/30'
                : 'bg-trading-bg text-trading-muted border-trading-border hover:border-trading-blue/50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredStrategies.map((strategy) => (
          <div 
            key={strategy.id}
            className={`bg-trading-bg rounded-lg p-4 border transition-all duration-300 cursor-pointer hover:shadow-lg ${
              selectedStrategy === strategy.id 
                ? 'border-trading-blue shadow-lg shadow-trading-blue/20' 
                : 'border-trading-border hover:border-trading-blue/50'
            }`}
            onClick={() => setSelectedStrategy(selectedStrategy === strategy.id ? null : strategy.id)}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${strategy.active ? 'bg-trading-green animate-pulse' : 'bg-trading-muted'}`}></div>
                <span className="font-bold text-trading-text">{strategy.name}</span>
                <div className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center space-x-1 ${getRiskColor(strategy.riskLevel)}`}>
                  {getRiskIcon(strategy.riskLevel)}
                  <span className="capitalize">{strategy.riskLevel}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {strategy.active ? (
                  <div className="flex items-center space-x-1 text-trading-green">
                    <Play className="w-4 h-4 fill-current" />
                    <span className="text-xs font-medium">ACTIVE</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 text-trading-muted">
                    <Pause className="w-4 h-4" />
                    <span className="text-xs font-medium">PAUSED</span>
                  </div>
                )}
              </div>
            </div>

            <p className="text-sm text-trading-muted mb-4 leading-relaxed">{strategy.description}</p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-trading-surface rounded-lg p-3 border border-trading-border/50">
                <div className="flex items-center space-x-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-trading-green" />
                  <div className="text-xs text-trading-muted">Performance</div>
                </div>
                <div className="text-lg font-bold text-trading-green">+{strategy.performance}%</div>
              </div>
              
              <div className="bg-trading-surface rounded-lg p-3 border border-trading-border/50">
                <div className="flex items-center space-x-2 mb-1">
                  <Target className="w-4 h-4 text-trading-cyan" />
                  <div className="text-xs text-trading-muted">Win Rate</div>
                </div>
                <div className="text-lg font-bold text-trading-cyan">{strategy.winRate}%</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-trading-muted">Accuracy</div>
                <div className="font-mono font-medium text-trading-text">{strategy.accuracy}%</div>
              </div>
              <div>
                <div className="text-trading-muted">Sharpe Ratio</div>
                <div className="font-mono font-medium text-trading-text">{strategy.sharpeRatio}</div>
              </div>
            </div>

            {selectedStrategy === strategy.id && (
              <div className="mt-4 pt-4 border-t border-trading-border/50 animate-slide-up">
                <div className="text-xs text-trading-muted mb-2">Strategy Details:</div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-trading-muted">Market Focus:</span>
                    <span className="text-trading-text">
                      {strategy.id.includes('crypto') ? 'Cryptocurrency' : 
                       strategy.id.includes('arbitrage') ? 'Multi-Asset' : 'All Markets'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-trading-muted">Execution Speed:</span>
                    <span className="text-trading-text">
                      {strategy.riskLevel === 'high' ? 'Ultra-fast (ms)' : 
                       strategy.riskLevel === 'medium' ? 'Fast (seconds)' : 'Moderate (minutes)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-trading-muted">Capital Allocation:</span>
                    <span className="text-trading-text">
                      {strategy.active ? `${Math.floor(Math.random() * 30 + 10)}%` : '0%'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredStrategies.length === 0 && (
        <div className="text-center py-8 text-trading-muted">
          <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <div>No strategies found for selected risk level</div>
        </div>
      )}
    </div>
  );
};

export default StrategyPanel;
