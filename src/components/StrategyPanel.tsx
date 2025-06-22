
import React from 'react';
import { Settings, BarChart3, Activity, Play, Pause } from 'lucide-react';
import { strategies } from '../utils/hftData';

const StrategyPanel = () => {
  return (
    <div className="bg-trading-surface rounded-lg border border-trading-border p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-trading-blue" />
          <h2 className="text-lg font-semibold text-trading-text">Trading Strategies</h2>
        </div>
      </div>

      <div className="space-y-3">
        {strategies.map((strategy) => (
          <div 
            key={strategy.id}
            className="bg-trading-bg rounded-lg p-3 border border-trading-border"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${strategy.active ? 'bg-trading-green' : 'bg-trading-muted'}`}></div>
                <span className="font-medium text-trading-text">{strategy.name}</span>
                {strategy.active ? (
                  <Play className="w-3 h-3 text-trading-green" />
                ) : (
                  <Pause className="w-3 h-3 text-trading-muted" />
                )}
              </div>
              <div className="flex items-center space-x-1 text-xs text-trading-green">
                <BarChart3 className="w-3 h-3" />
                <span>+{strategy.performance}%</span>
              </div>
            </div>

            <p className="text-xs text-trading-muted mb-3">{strategy.description}</p>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <div className="text-trading-muted">Accuracy</div>
                <div className="font-mono text-trading-text">{strategy.accuracy}%</div>
              </div>
              <div>
                <div className="text-trading-muted">Sharpe</div>
                <div className="font-mono text-trading-text">{strategy.sharpeRatio}</div>
              </div>
              <div>
                <div className="text-trading-muted">Status</div>
                <div className={`font-medium ${strategy.active ? 'text-trading-green' : 'text-trading-muted'}`}>
                  {strategy.active ? 'Active' : 'Paused'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StrategyPanel;
