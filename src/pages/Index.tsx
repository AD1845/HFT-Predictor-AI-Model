
import React, { useState } from 'react';
import TradingHeader from '../components/TradingHeader';
import MarketOverview from '../components/MarketOverview';
import PredictionPanel from '../components/PredictionPanel';
import StrategyPanel from '../components/StrategyPanel';
import RealTimeChart from '../components/RealTimeChart';
import MarketSentiment from '../components/MarketSentiment';
import LiveTradingPanel from '../components/LiveTradingPanel';
import AITradingBot from '../components/AITradingBot';
import PortfolioAnalytics from '../components/PortfolioAnalytics';
import { BarChart3, Activity, Bot, Wallet, MessageCircle } from 'lucide-react';

const Index = () => {
  const [activeTab, setActiveTab] = useState<'trading' | 'analytics' | 'bot'>('trading');

  const tabs = [
    { id: 'trading', label: 'Live Trading', icon: Activity },
    { id: 'analytics', label: 'Portfolio', icon: Wallet },
    { id: 'bot', label: 'AI Assistant', icon: Bot }
  ];

  return (
    <div className="min-h-screen bg-trading-bg">
      <TradingHeader />
      
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Market Overview */}
        <MarketOverview />
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Chart - Takes 2 columns on xl screens */}
          <div className="xl:col-span-2">
            <RealTimeChart />
          </div>
          
          {/* Predictions */}
          <div className="xl:col-span-1">
            <PredictionPanel />
          </div>
          
          {/* Market Sentiment */}
          <div className="xl:col-span-1">
            <MarketSentiment />
          </div>
        </div>
        
        {/* Strategy Panel */}
        <StrategyPanel />

        {/* Enhanced Features Tabs */}
        <div className="bg-trading-surface rounded-lg border border-trading-border">
          {/* Tab Navigation */}
          <div className="flex border-b border-trading-border">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-trading-cyan border-b-2 border-trading-cyan bg-trading-cyan/5'
                      : 'text-trading-muted hover:text-trading-text hover:bg-trading-bg/50'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'trading' && (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2">
                  <LiveTradingPanel />
                </div>
                <div>
                  <div className="bg-trading-bg rounded-lg border border-trading-border p-4">
                    <h3 className="text-trading-text font-semibold mb-3 flex items-center space-x-2">
                      <MessageCircle className="w-4 h-4 text-trading-orange" />
                      <span>Quick Actions</span>
                    </h3>
                    <div className="space-y-2">
                      <button className="w-full bg-trading-green/20 hover:bg-trading-green/30 text-trading-green border border-trading-green/30 rounded py-2 px-3 text-sm font-medium transition-colors">
                        Auto-Trade Mode
                      </button>
                      <button className="w-full bg-trading-blue/20 hover:bg-trading-blue/30 text-trading-blue border border-trading-blue/30 rounded py-2 px-3 text-sm font-medium transition-colors">
                        Copy Top Trader
                      </button>
                      <button className="w-full bg-trading-purple/20 hover:bg-trading-purple/30 text-trading-purple border border-trading-purple/30 rounded py-2 px-3 text-sm font-medium transition-colors">
                        Risk Alert Setup
                      </button>
                      <button className="w-full bg-trading-yellow/20 hover:bg-trading-yellow/30 text-trading-yellow border border-trading-yellow/30 rounded py-2 px-3 text-sm font-medium transition-colors">
                        Strategy Backtest
                      </button>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-trading-border/50">
                      <h4 className="text-trading-muted text-sm font-medium mb-2">Market Status</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-trading-muted">Orders Today:</span>
                          <span className="text-trading-text font-mono">247</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-trading-muted">Success Rate:</span>
                          <span className="text-trading-green font-mono">94.2%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-trading-muted">Avg Response:</span>
                          <span className="text-trading-cyan font-mono">12ms</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && <PortfolioAnalytics />}

            {activeTab === 'bot' && (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2">
                  <AITradingBot />
                </div>
                <div className="space-y-4">
                  <div className="bg-trading-bg rounded-lg border border-trading-border p-4">
                    <h3 className="text-trading-text font-semibold mb-3">AI Features</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-trading-green rounded-full"></div>
                        <span className="text-trading-text">Real-time Analysis</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-trading-green rounded-full"></div>
                        <span className="text-trading-text">Strategy Recommendations</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-trading-green rounded-full"></div>
                        <span className="text-trading-text">Risk Management</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-trading-yellow rounded-full"></div>
                        <span className="text-trading-text">News Integration</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-trading-cyan rounded-full"></div>
                        <span className="text-trading-text">24/7 Support</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-trading-bg rounded-lg border border-trading-border p-4">
                    <h3 className="text-trading-text font-semibold mb-3">Recent Insights</h3>
                    <div className="space-y-3 text-xs">
                      <div className="bg-trading-surface p-2 rounded border border-trading-border/50">
                        <div className="text-trading-cyan font-medium">Market Alert</div>
                        <div className="text-trading-muted">BTC showing strong momentum signals</div>
                      </div>
                      <div className="bg-trading-surface p-2 rounded border border-trading-border/50">
                        <div className="text-trading-green font-medium">Strategy Update</div>
                        <div className="text-trading-muted">Mean reversion working well in current conditions</div>
                      </div>
                      <div className="bg-trading-surface p-2 rounded border border-trading-border/50">
                        <div className="text-trading-yellow font-medium">Risk Notice</div>
                        <div className="text-trading-muted">Elevated volatility expected in next 2 hours</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
