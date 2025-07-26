import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { OrderBookFeatureExtractor, OrderBookSnapshot } from '@/utils/orderBookFeatures';
import { StatisticalArbitrageEngine } from '@/utils/statisticalArbitrage';
import { AlphaFactorEngine } from '@/utils/alphaFactors';
import { TransformerPredictor } from '@/utils/transformerModel';
import { RiskManager, RiskLimits } from '@/utils/riskManagement';

export const HedgeFundPipeline: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [riskMetrics, setRiskMetrics] = useState<any>({});
  
  // Initialize engines
  const [engines] = useState(() => ({
    orderBook: new OrderBookFeatureExtractor(),
    statArb: new StatisticalArbitrageEngine(),
    alpha: new AlphaFactorEngine(),
    transformer: new TransformerPredictor(),
    risk: new RiskManager({
      maxPositionSize: 100000,
      dailyLossLimit: 50000,
      maxDrawdown: 0.15,
      concentrationLimit: 0.3,
      leverageLimit: 3,
      stopLossPercent: 2,
      takeProfitPercent: 5,
      maxCorrelatedPositions: 5
    } as RiskLimits)
  }));

  useEffect(() => {
    if (!isActive) return;
    
    const interval = setInterval(() => {
      // Simulate real-time processing
      processMarketData();
    }, 100);
    
    return () => clearInterval(interval);
  }, [isActive]);

  const processMarketData = () => {
    // Simulate market data processing with all engines
    const mockData = generateMockData();
    
    // Extract features
    const features = engines.orderBook.extractFeatures(mockData.orderBook);
    
    // Generate alpha factors
    const alphaFactors = engines.alpha.generateAlphaFactors('AAPL');
    
    // Statistical arbitrage signals
    const statArbSignals = engines.statArb.generateStatArbSignals(new Map([['AAPL', 150], ['MSFT', 300]]));
    
    // Transformer prediction
    const prediction = engines.transformer.predict(Object.values(features).slice(0, 32));
    
    // Update state
    setPredictions(prev => [...prev.slice(-10), {
      timestamp: Date.now(),
      features,
      alphaFactors,
      statArbSignals,
      prediction
    }]);
    
    setRiskMetrics(engines.risk.calculateRiskMetrics());
  };

  const generateMockData = () => ({
    orderBook: {
      symbol: 'AAPL',
      timestamp: Date.now(),
      bids: Array(10).fill(0).map((_, i) => ({ price: 150 - i * 0.01, size: Math.random() * 1000 })),
      asks: Array(10).fill(0).map((_, i) => ({ price: 150.05 + i * 0.01, size: Math.random() * 1000 })),
      lastPrice: 150.02,
      lastSize: Math.random() * 100
    } as OrderBookSnapshot
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Hedge Fund-Style Trading Pipeline
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Order Book Features</h4>
              <div className="text-xs space-y-1">
                <div>Spread: {predictions[predictions.length - 1]?.features?.spread?.toFixed(4) || 'N/A'}</div>
                <div>Flow Imbalance: {predictions[predictions.length - 1]?.features?.orderFlowImbalance?.toFixed(3) || 'N/A'}</div>
                <div>Smart Money: {predictions[predictions.length - 1]?.features?.smartMoney?.toFixed(3) || 'N/A'}</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Alpha Factors</h4>
              <div className="text-xs space-y-1">
                {predictions[predictions.length - 1]?.alphaFactors?.slice(0, 3).map((factor: any, i: number) => (
                  <div key={i}>{factor?.name}: {factor?.value?.toFixed(3)}</div>
                )) || <div>Loading...</div>}
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">ML Prediction</h4>
              <div className="text-xs space-y-1">
                <div>Price Change: {predictions[predictions.length - 1]?.prediction?.price_change?.toFixed(4) || 'N/A'}</div>
                <div>Confidence: {(predictions[predictions.length - 1]?.prediction?.confidence * 100)?.toFixed(1) || 'N/A'}%</div>
                <Badge variant={predictions[predictions.length - 1]?.prediction?.price_change > 0 ? "default" : "destructive"}>
                  {predictions[predictions.length - 1]?.prediction?.price_change > 0 ? 'BULLISH' : 'BEARISH'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Risk Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Portfolio Value</div>
              <div className="font-semibold">${riskMetrics.portfolioValue?.toLocaleString() || '0'}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Daily PnL</div>
              <div className={`font-semibold ${riskMetrics.dailyPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${riskMetrics.dailyPnL?.toLocaleString() || '0'}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Max Drawdown</div>
              <div className="font-semibold">{(riskMetrics.maxDrawdown * 100)?.toFixed(2) || '0'}%</div>
            </div>
            <div>
              <div className="text-muted-foreground">Sharpe Ratio</div>
              <div className="font-semibold">{riskMetrics.sharpeRatio?.toFixed(2) || '0'}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};