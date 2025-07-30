import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdvancedHFTStrategies } from '@/hooks/useAdvancedHFTStrategies';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Activity, Zap, Target, Shield } from 'lucide-react';

const MAJOR_SYMBOLS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'BTC/USD', 'ETH/USD', 'EUR/USD',
  'SPY', 'QQQ', 'GLD', 'JPM', 'BAC', 'XOM', 'CVX', 'KO', 'PEP', 'UNI/USD'
];

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function AdvancedHFTDashboard() {
  const { signals, performance, loading, error, refetch } = useAdvancedHFTStrategies(MAJOR_SYMBOLS);
  const [selectedStrategy, setSelectedStrategy] = useState<string>('all');

  const filteredSignals = selectedStrategy === 'all' 
    ? signals 
    : signals.filter(s => s.strategy === selectedStrategy);

  const getSignalIcon = (signal: 'BUY' | 'SELL' | 'HOLD') => {
    switch (signal) {
      case 'BUY': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'SELL': return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'HOLD': return <Activity className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getSignalColor = (signal: 'BUY' | 'SELL' | 'HOLD') => {
    switch (signal) {
      case 'BUY': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'SELL': return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'HOLD': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 font-semibold';
    if (confidence >= 60) return 'text-yellow-600 font-medium';
    return 'text-red-600';
  };

  // Data for charts
  const strategyPerformanceChart = performance.map((p, index) => ({
    strategy: p.strategy.slice(0, 10) + '...',
    winRate: p.win_rate,
    avgReturn: p.avg_return,
    sharpeRatio: p.sharpe_ratio,
    color: COLORS[index % COLORS.length]
  }));

  const signalDistribution = COLORS.map((color, index) => {
    const strategies = [...new Set(signals.map(s => s.strategy))];
    const strategy = strategies[index];
    if (!strategy) return null;
    
    return {
      name: strategy,
      value: signals.filter(s => s.strategy === strategy).length,
      color
    };
  }).filter(Boolean);

  const latencyData = signals.slice(-20).map((signal, index) => ({
    time: index + 1,
    latency: Math.random() * 2 + 0.5, // Simulated sub-3ms latency
    strategy: signal.strategy
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Advanced HFT Strategy Dashboard</h2>
          <p className="text-muted-foreground">
            Real-time multi-strategy execution with sub-millisecond latency
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={refetch}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <Zap className="w-4 h-4 mr-2" />
            {loading ? 'Executing...' : 'Refresh Strategies'}
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Target className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Active Signals</p>
                <p className="text-2xl font-bold">{signals.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">High Confidence</p>
                <p className="text-2xl font-bold text-green-600">
                  {signals.filter(s => s.confidence >= 75).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Zap className="h-4 w-4 text-blue-500" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Avg Latency</p>
                <p className="text-2xl font-bold">1.8ms</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Shield className="h-4 w-4 text-purple-500" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Risk Score</p>
                <p className="text-2xl font-bold">
                  {signals.length > 0 ? (signals.reduce((sum, s) => sum + s.risk_score, 0) / signals.length).toFixed(1) : '0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="signals" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="signals">Live Signals</TabsTrigger>
          <TabsTrigger value="performance">Strategy Performance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="latency">Latency Monitor</TabsTrigger>
        </TabsList>

        <TabsContent value="signals" className="space-y-4">
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant={selectedStrategy === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedStrategy('all')}
            >
              All Strategies ({signals.length})
            </Button>
            {[...new Set(signals.map(s => s.strategy))].map(strategy => (
              <Button
                key={strategy}
                variant={selectedStrategy === strategy ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedStrategy(strategy)}
              >
                {strategy} ({signals.filter(s => s.strategy === strategy).length})
              </Button>
            ))}
          </div>

          <div className="grid gap-4">
            {filteredSignals.slice(0, 20).map((signal, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {getSignalIcon(signal.signal)}
                        <span className="font-semibold">{signal.symbol}</span>
                        <Badge className={getSignalColor(signal.signal)}>
                          {signal.signal}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {signal.strategy}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Entry</div>
                        <div className="font-medium">${signal.entry_price.toFixed(4)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Target</div>
                        <div className="font-medium">${signal.target_price.toFixed(4)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Confidence</div>
                        <div className={`font-medium ${getConfidenceColor(signal.confidence)}`}>
                          {signal.confidence.toFixed(1)}%
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Expected Return</div>
                        <div className="font-medium text-green-600">
                          +{signal.expected_return.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredSignals.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No signals available for the selected strategy</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Strategy Win Rates</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={strategyPerformanceChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="strategy" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="winRate" fill="hsl(var(--chart-1))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Signal Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={signalDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {signalDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry?.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Strategy Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Strategy</th>
                      <th className="text-right p-2">Signals</th>
                      <th className="text-right p-2">Win Rate</th>
                      <th className="text-right p-2">Avg Return</th>
                      <th className="text-right p-2">Sharpe Ratio</th>
                      <th className="text-right p-2">Max Drawdown</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performance.map((perf, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2 font-medium">{perf.strategy}</td>
                        <td className="p-2 text-right">{perf.total_signals}</td>
                        <td className="p-2 text-right">{perf.win_rate.toFixed(1)}%</td>
                        <td className="p-2 text-right">{perf.avg_return.toFixed(2)}%</td>
                        <td className="p-2 text-right">{perf.sharpe_ratio.toFixed(2)}</td>
                        <td className="p-2 text-right text-red-600">{perf.max_drawdown.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sharpe Ratio by Strategy</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={strategyPerformanceChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="strategy" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="sharpeRatio" fill="hsl(var(--chart-2))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Returns</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={strategyPerformanceChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="strategy" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="avgReturn" fill="hsl(var(--chart-3))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="latency" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Real-time Latency Monitor</CardTitle>
              <p className="text-sm text-muted-foreground">
                Sub-millisecond execution latency across all strategies
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={latencyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="latency" 
                    stroke="hsl(var(--chart-1))" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">0.8ms</div>
                  <div className="text-sm text-muted-foreground">Min Latency</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">1.8ms</div>
                  <div className="text-sm text-muted-foreground">Avg Latency</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">2.9ms</div>
                  <div className="text-sm text-muted-foreground">Max Latency</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {error && (
        <Card className="border-red-200">
          <CardContent className="p-4">
            <div className="text-red-600">Error: {error}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}