
import React from 'react';
import { Activity, TrendingUp, Zap } from 'lucide-react';

const TradingHeader = () => {
  return (
    <div className="bg-trading-surface border-b border-trading-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Zap className="w-8 h-8 text-trading-blue" />
              <div className="absolute inset-0 animate-pulse-glow">
                <Zap className="w-8 h-8 text-trading-cyan opacity-50" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gradient-purple">HFT Predictor AI</h1>
              <p className="text-trading-muted text-sm">High-Frequency Trading Intelligence</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-trading-green" />
            <span className="text-sm text-trading-green">Live Market</span>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-trading-muted">Market Status</div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-trading-green rounded-full animate-pulse"></div>
              <span className="text-trading-green font-medium">Active</span>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-trading-muted">Latency</div>
            <div className="text-trading-cyan font-mono">0.23ms</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingHeader;
