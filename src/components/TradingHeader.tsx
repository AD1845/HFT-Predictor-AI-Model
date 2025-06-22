
import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, Zap, Wifi, Database, Clock } from 'lucide-react';

const TradingHeader = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [latency, setLatency] = useState(0.23);
  const [dataPoints, setDataPoints] = useState(0);

  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const latencyInterval = setInterval(() => {
      setLatency(Math.random() * 0.5 + 0.1); // 0.1-0.6ms
    }, 2000);

    const dataInterval = setInterval(() => {
      setDataPoints(prev => prev + Math.floor(Math.random() * 100) + 50);
    }, 1000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(latencyInterval);
      clearInterval(dataInterval);
    };
  }, []);

  return (
    <div className="bg-trading-surface border-b border-trading-border px-6 py-4 sticky top-0 z-50 backdrop-blur-sm bg-trading-surface/95">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Zap className="w-8 h-8 text-trading-blue" />
              <div className="absolute inset-0 animate-pulse-glow">
                <Zap className="w-8 h-8 text-trading-cyan opacity-50" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gradient-purple">HFT Predictor AI</h1>
              <p className="text-trading-muted text-sm">High-Frequency Trading Intelligence Platform</p>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-trading-bg border border-trading-border/50">
              <Clock className="w-4 h-4 text-trading-cyan" />
              <div>
                <div className="text-trading-muted text-xs">Market Time</div>
                <div className="font-mono text-trading-text">
                  {currentTime.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    second: '2-digit',
                    timeZone: 'America/New_York'
                  })} EST
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-trading-bg border border-trading-border/50">
              <Database className="w-4 h-4 text-trading-purple" />
              <div>
                <div className="text-trading-muted text-xs">Data Points</div>
                <div className="font-mono text-trading-text">
                  {dataPoints.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-trading-green/10 border border-trading-green/20">
              <Activity className="w-4 h-4 text-trading-green animate-pulse" />
              <div>
                <div className="text-xs text-trading-green font-medium">LIVE MARKET</div>
                <div className="text-xs text-trading-muted">Real-time data</div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-trading-muted">Market Status</div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-trading-green rounded-full animate-pulse"></div>
                <span className="text-trading-green font-medium">Active</span>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-trading-muted flex items-center space-x-1">
                <Wifi className="w-3 h-3" />
                <span>Latency</span>
              </div>
              <div className={`font-mono text-lg font-bold ${
                latency < 0.3 ? 'text-trading-green' : 
                latency < 0.5 ? 'text-trading-yellow' : 'text-trading-red'
              }`}>
                {latency.toFixed(2)}ms
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-trading-muted">API Status</div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-trading-cyan rounded-full animate-pulse"></div>
                <span className="text-trading-cyan font-medium">Connected</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Performance Summary Bar */}
      <div className="mt-4 pt-4 border-t border-trading-border/50">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-trading-green" />
              <span className="text-trading-muted">Portfolio:</span>
              <span className="font-mono font-bold text-trading-green">+$12,847.52</span>
              <span className="text-trading-green">(+2.34%)</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-trading-muted">Today's P&L:</span>
              <span className="font-mono font-bold text-trading-cyan">+$1,284.67</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-trading-muted">Active Positions:</span>
              <span className="font-mono text-trading-text">7</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-xs text-trading-muted">
            <span>Last Update: {currentTime.toLocaleTimeString()}</span>
            <div className="flex items-center space-x-1">
              <div className="w-1 h-1 bg-trading-green rounded-full animate-pulse"></div>
              <span>Live</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingHeader;
