import React, { useState, useEffect, useCallback } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Settings, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Brain, 
  Zap, 
  Shield,
  BarChart3,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

import { TradingStrategy, TradeSignal, MarketData, NewsItem, RiskControls, StrategyPerformance } from '../types/strategy';
import { StatisticalArbitrageStrategy } from '../strategies/StatisticalArbitrageStrategy';
import { LongShortEquityStrategy } from '../strategies/LongShortEquityStrategy';
import { EventDrivenStrategy } from '../strategies/EventDrivenStrategy';
import { MomentumStrategy } from '../strategies/MomentumStrategy';
import { MLStrategy } from '../strategies/MLStrategy';
import { useRealTimeMarketData } from '../hooks/useRealTimeMarketData';
import { useMarketNews } from '../hooks/useMarketNews';

interface StrategyEngineProps {
  onSignalGenerated?: (signals: TradeSignal[]) => void;
}

const StrategyEngine: React.FC<StrategyEngineProps> = ({ onSignalGenerated }) => {
  const [strategies, setStrategies] = useState<TradingStrategy[]>([]);
  const [activeSignals, setActiveSignals] = useState<TradeSignal[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<string>('all');
  const [performanceData, setPerformanceData] = useState<StrategyPerformance[]>([]);

  // Market data hooks
  const symbols = ['AAPL', 'GOOGL', 'MSFT', 'NVDA', 'META', 'TSLA', 'JPM', 'BAC', 'JNJ', 'XOM'];
  const { data: marketData, loading: marketLoading } = useRealTimeMarketData(symbols, 10000);
  const { news, loading: newsLoading } = useMarketNews();

  // Initialize strategies
  useEffect(() => {
    const defaultRiskControls: RiskControls = {
      maxPositionSize: 10, // 10% of portfolio
      stopLoss: 5, // 5%
      takeProfit: 10, // 10%
      maxDrawdown: 15, // 15%
      dailyLossLimit: 20 // 20%
    };

    const strategyInstances = [
      new StatisticalArbitrageStrategy(defaultRiskControls),
      new LongShortEquityStrategy(defaultRiskControls),
      new EventDrivenStrategy(defaultRiskControls),
      new MomentumStrategy(defaultRiskControls),
      new MLStrategy(defaultRiskControls)
    ];

    setStrategies(strategyInstances);
    setPerformanceData(strategyInstances.map(s => s.getPerformance()));
  }, []);

  // Strategy execution engine
  const executeStrategies = useCallback(async () => {
    if (!isRunning || marketData.length === 0) return;

    const allSignals: TradeSignal[] = [];
    const newPerformanceData: StrategyPerformance[] = [];

    for (const strategy of strategies) {
      if (!strategy.isStrategyActive()) continue;

      try {
        // Add technical indicators to market data
        const enrichedMarketData = marketData.map(data => ({
          ...data,
          high: data.price * 1.01,
          low: data.price * 0.99,
          open: data.price * 0.995,
          indicators: {
            rsi: 30 + Math.random() * 40, // Simulate RSI 30-70
            macd: (Math.random() - 0.5) * 2, // Simulate MACD -1 to 1
            sma20: data.price * (0.98 + Math.random() * 0.04), // SMA ±2%
            sma50: data.price * (0.95 + Math.random() * 0.1), // SMA ±5%
            vwap: data.price * (0.99 + Math.random() * 0.02), // VWAP ±1%
            bollinger: {
              upper: data.price * 1.02,
              middle: data.price,
              lower: data.price * 0.98
            }
          }
        }));

        // Convert news to NewsItem format
        const newsItems = news.map(item => ({
          ...item,
          publishedAt: item.published_at,
          impact: 'medium' as const
        }));
        
        const signals = await strategy.generateSignal(enrichedMarketData, newsItems);
        allSignals.push(...signals);
        newPerformanceData.push(strategy.getPerformance());
      } catch (error) {
        console.error(`Error in strategy ${strategy.getName()}:`, error);
      }
    }

    // Filter and rank signals
    const filteredSignals = filterAndRankSignals(allSignals);
    setActiveSignals(filteredSignals);
    setPerformanceData(newPerformanceData);

    if (onSignalGenerated && filteredSignals.length > 0) {
      onSignalGenerated(filteredSignals);
    }
  }, [strategies, marketData, news, isRunning, onSignalGenerated]);

  // Signal filtering and ranking logic
  const filterAndRankSignals = (signals: TradeSignal[]): TradeSignal[] => {
    // Remove duplicate signals for same symbol
    const signalMap = new Map<string, TradeSignal>();
    
    signals.forEach(signal => {
      const existing = signalMap.get(signal.symbol);
      if (!existing || signal.confidence > existing.confidence) {
        signalMap.set(signal.symbol, signal);
      }
    });

    // Sort by confidence and return top signals
    return Array.from(signalMap.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10); // Top 10 signals
  };

  // Execute strategies periodically
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning) {
      executeStrategies(); // Execute immediately
      interval = setInterval(executeStrategies, 15000); // Every 15 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, executeStrategies]);

  const toggleStrategy = (strategyId: string) => {
    setStrategies(prev => prev.map(strategy => {
      if (strategy.getId() === strategyId) {
        strategy.setActive(!strategy.isStrategyActive());
      }
      return strategy;
    }));
  };

  const getSignalIcon = (action: string) => {
    switch (action) {
      case 'BUY': return <TrendingUp className="w-4 h-4 text-trading-green" />;
      case 'SELL': return <TrendingDown className="w-4 h-4 text-trading-red" />;
      default: return <Activity className="w-4 h-4 text-trading-yellow" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-trading-green';
    if (confidence >= 0.6) return 'text-trading-yellow';
    return 'text-trading-red';
  };

  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;

  return (
    <div className="space-y-6">
      {/* Strategy Engine Header */}
      <Card className="bg-trading-surface border-trading-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Brain className="w-6 h-6 text-trading-blue" />
              <Zap className="w-3 h-3 text-trading-yellow absolute -top-1 -right-1 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-trading-text">Strategy Engine</h2>
              <p className="text-sm text-trading-muted">
                Modular HFT trading strategies with ML-powered signals
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Shield className={`w-5 h-5 ${isRunning ? 'text-trading-green' : 'text-trading-muted'}`} />
              <span className="text-sm text-trading-text">Engine Status</span>
              <Switch
                checked={isRunning}
                onCheckedChange={setIsRunning}
                disabled={marketLoading || newsLoading}
              />
            </div>
            
            <Badge variant={isRunning ? "default" : "secondary"}>
              {isRunning ? 'ACTIVE' : 'PAUSED'}
            </Badge>
          </div>
        </div>

        {/* Strategy Controls */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {strategies.map(strategy => (
            <div key={strategy.getId()} className="flex items-center justify-between p-3 bg-trading-bg border border-trading-border rounded">
              <div>
                <div className="text-sm font-medium text-trading-text">{strategy.getName()}</div>
                <div className="text-xs text-trading-muted">
                  {strategy.getPerformance().totalTrades} trades
                </div>
              </div>
              <Switch
                checked={strategy.isStrategyActive()}
                onCheckedChange={() => toggleStrategy(strategy.getId())}
              />
            </div>
          ))}
        </div>
      </Card>

      <Tabs value={selectedStrategy} onValueChange={setSelectedStrategy} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Signals</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {/* Active Signals */}
          <Card className="bg-trading-surface border-trading-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-trading-text">Active Trading Signals</h3>
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-trading-cyan" />
                <span className="text-sm text-trading-muted">{activeSignals.length} signals</span>
              </div>
            </div>
            
            {activeSignals.length === 0 ? (
              <div className="text-center py-8 text-trading-muted">
                {isRunning ? 'Analyzing market conditions...' : 'Start the strategy engine to generate signals'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeSignals.map((signal, index) => (
                  <Card key={index} className="bg-trading-bg border-trading-border p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-trading-text">{signal.symbol}</span>
                        {getSignalIcon(signal.action)}
                        <span className={`text-xs font-medium ${
                          signal.action === 'BUY' ? 'text-trading-green' : 'text-trading-red'
                        }`}>
                          {signal.action}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {(signal.confidence * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-trading-muted">Confidence</span>
                        <span className={getConfidenceColor(signal.confidence)}>
                          {formatPercentage(signal.confidence)}
                        </span>
                      </div>
                      {signal.stopLoss && (
                        <div className="flex justify-between">
                          <span className="text-trading-muted">Stop Loss</span>
                          <span className="text-trading-red">{signal.stopLoss}%</span>
                        </div>
                      )}
                      {signal.takeProfit && (
                        <div className="flex justify-between">
                          <span className="text-trading-muted">Take Profit</span>
                          <span className="text-trading-green">{signal.takeProfit}%</span>
                        </div>
                      )}
                      <div className="text-trading-muted text-xs pt-2 border-t border-trading-border/50">
                        {signal.reason.substring(0, 60)}...
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {/* Performance Dashboard */}
          <Card className="bg-trading-surface border-trading-border p-6">
            <h3 className="text-lg font-semibold text-trading-text mb-4">Strategy Performance</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {performanceData.map(perf => (
                <Card key={perf.strategyId} className="bg-trading-bg border-trading-border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-trading-text">{perf.strategyName}</h4>
                    <Badge variant={perf.winRate > 0.6 ? "default" : "secondary"}>
                      {formatPercentage(perf.winRate)} Win Rate
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-trading-muted">Sharpe Ratio</div>
                      <div className={`font-mono ${perf.sharpeRatio > 1 ? 'text-trading-green' : 'text-trading-text'}`}>
                        {perf.sharpeRatio.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-trading-muted">Max Drawdown</div>
                      <div className="font-mono text-trading-red">
                        {formatPercentage(perf.maxDrawdown)}
                      </div>
                    </div>
                    <div>
                      <div className="text-trading-muted">Total Return</div>
                      <div className={`font-mono ${perf.totalReturn >= 0 ? 'text-trading-green' : 'text-trading-red'}`}>
                        {formatPercentage(perf.totalReturn)}
                      </div>
                    </div>
                    <div>
                      <div className="text-trading-muted">Avg Latency</div>
                      <div className="font-mono text-trading-text">
                        {perf.averageLatency.toFixed(0)}ms
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-trading-border/50">
                    <div className="flex justify-between text-xs text-trading-muted">
                      <span>Total Trades: {perf.totalTrades}</span>
                      <span>Updated: {new Date(perf.lastUpdated).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* Analytics Dashboard */}
          <Card className="bg-trading-surface border-trading-border p-6">
            <h3 className="text-lg font-semibold text-trading-text mb-4">Real-Time Analytics</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-trading-blue">{activeSignals.length}</div>
                <div className="text-sm text-trading-muted">Active Signals</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-trading-green">{strategies.filter(s => s.isStrategyActive()).length}</div>
                <div className="text-sm text-trading-muted">Active Strategies</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-trading-cyan">{marketData.length}</div>
                <div className="text-sm text-trading-muted">Monitored Symbols</div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          {/* Settings Panel */}
          <Card className="bg-trading-surface border-trading-border p-6">
            <h3 className="text-lg font-semibold text-trading-text mb-4">Strategy Configuration</h3>
            
            <div className="space-y-4">
              <div className="text-sm text-trading-muted">
                Configure individual strategy parameters, risk controls, and ML model settings.
              </div>
              
              <Button variant="outline" className="w-full">
                <Settings className="w-4 h-4 mr-2" />
                Open Advanced Settings
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StrategyEngine;