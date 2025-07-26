import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { TransformerPredictor } from '@/utils/transformerModel';
import { OrderBookFeatureExtractor } from '@/utils/orderBookFeatures';

interface MarketMakingOrder {
  id: string;
  symbol: string;
  side: 'bid' | 'ask';
  price: number;
  size: number;
  timestamp: number;
  status: 'active' | 'filled' | 'cancelled';
}

export const MarketMakingBot: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [orders, setOrders] = useState<MarketMakingOrder[]>([]);
  const [pnl, setPnl] = useState(0);
  const [inventory, setInventory] = useState(0);
  const [spreadBps, setSpreadBps] = useState(5); // 5 basis points default

  const [engines] = useState(() => ({
    predictor: new TransformerPredictor(),
    orderBook: new OrderBookFeatureExtractor()
  }));

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      updateMarketMaking();
    }, 250); // 250ms updates for market making

    return () => clearInterval(interval);
  }, [isActive, spreadBps]);

  const updateMarketMaking = () => {
    // Simulate market data
    const currentPrice = 150 + (Math.random() - 0.5) * 2;
    const prediction = engines.predictor.predict(Array(32).fill(0).map(() => Math.random()));
    
    // Calculate optimal bid/ask prices
    const halfSpread = (currentPrice * spreadBps) / (2 * 10000);
    const skew = prediction.price_change * 0.1; // Skew based on prediction
    
    const bidPrice = currentPrice - halfSpread + skew;
    const askPrice = currentPrice + halfSpread + skew;
    
    // Generate new orders
    if (orders.filter(o => o.status === 'active').length < 4) {
      const newOrders: MarketMakingOrder[] = [
        {
          id: `bid-${Date.now()}`,
          symbol: 'AAPL',
          side: 'bid',
          price: bidPrice,
          size: Math.floor(Math.random() * 500) + 100,
          timestamp: Date.now(),
          status: 'active'
        },
        {
          id: `ask-${Date.now()}`,
          symbol: 'AAPL',
          side: 'ask',
          price: askPrice,
          size: Math.floor(Math.random() * 500) + 100,
          timestamp: Date.now(),
          status: 'active'
        }
      ];

      setOrders(prev => [...prev.slice(-10), ...newOrders]);
    }

    // Simulate order fills
    setOrders(prev => prev.map(order => {
      if (order.status === 'active' && Math.random() > 0.95) {
        const fillPnl = order.side === 'bid' ? 
          (currentPrice - order.price) * order.size : 
          (order.price - currentPrice) * order.size;
        
        setPnl(p => p + fillPnl);
        setInventory(inv => inv + (order.side === 'bid' ? order.size : -order.size));
        
        return { ...order, status: 'filled' as const };
      }
      return order;
    }));
  };

  const activeOrders = orders.filter(o => o.status === 'active');
  const filledOrders = orders.filter(o => o.status === 'filled').slice(-5);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Market Making Bot
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">PnL</div>
              <div className={`font-semibold text-lg ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${pnl.toFixed(2)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Inventory</div>
              <div className="font-semibold text-lg">{inventory}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Active Orders</div>
              <div className="font-semibold text-lg">{activeOrders.length}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Spread (bps)</div>
              <div className="font-semibold text-lg">{spreadBps}</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Spread Control</span>
              <span className="text-sm text-muted-foreground">{spreadBps} bps</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              value={spreadBps}
              onChange={(e) => setSpreadBps(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {activeOrders.length === 0 ? (
              <div className="text-sm text-muted-foreground">No active orders</div>
            ) : (
              activeOrders.map(order => (
                <div key={order.id} className="flex justify-between items-center p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <Badge variant={order.side === 'bid' ? 'default' : 'destructive'}>
                      {order.side.toUpperCase()}
                    </Badge>
                    <span className="font-mono text-sm">${order.price.toFixed(2)}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {order.size} shares
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Fills</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filledOrders.length === 0 ? (
              <div className="text-sm text-muted-foreground">No recent fills</div>
            ) : (
              filledOrders.map(order => (
                <div key={order.id} className="flex justify-between items-center p-2 border rounded bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Badge variant={order.side === 'bid' ? 'default' : 'destructive'}>
                      {order.side.toUpperCase()}
                    </Badge>
                    <span className="font-mono text-sm">${order.price.toFixed(2)}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {order.size} shares
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};