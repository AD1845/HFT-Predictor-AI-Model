
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Target, AlertTriangle, Activity } from 'lucide-react';
import { generateMarketData, marketAssets } from '../utils/hftData';

interface Position {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  timestamp: number;
}

interface Order {
  id: string;
  symbol: string;
  type: 'market' | 'limit' | 'stop';
  side: 'buy' | 'sell';
  size: number;
  price?: number;
  status: 'pending' | 'filled' | 'cancelled';
  timestamp: number;
}

const LiveTradingPanel = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState('BTC/USD');
  const [orderSize, setOrderSize] = useState(0.1);
  const [orderPrice, setOrderPrice] = useState(0);
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop'>('market');
  const [currentPrices, setCurrentPrices] = useState<{[key: string]: number}>({});

  useEffect(() => {
    // Update current prices
    const updatePrices = () => {
      const newPrices: {[key: string]: number} = {};
      Object.keys(marketAssets).forEach(symbol => {
        const data = generateMarketData(symbol, marketAssets[symbol as keyof typeof marketAssets].basePrice);
        newPrices[symbol] = data.price;
      });
      setCurrentPrices(newPrices);
    };

    updatePrices();
    const interval = setInterval(updatePrices, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Update P&L for positions
    setPositions(prev => prev.map(pos => {
      const currentPrice = currentPrices[pos.symbol] || pos.currentPrice;
      const pnl = pos.side === 'long' 
        ? (currentPrice - pos.entryPrice) * pos.size
        : (pos.entryPrice - currentPrice) * pos.size;
      const pnlPercent = (pnl / (pos.entryPrice * pos.size)) * 100;
      
      return {
        ...pos,
        currentPrice,
        pnl,
        pnlPercent
      };
    }));
  }, [currentPrices]);

  const executeOrder = (side: 'buy' | 'sell') => {
    const currentPrice = currentPrices[selectedSymbol] || marketAssets[selectedSymbol as keyof typeof marketAssets].basePrice;
    const executePrice = orderType === 'market' ? currentPrice : orderPrice;
    
    const newOrder: Order = {
      id: Date.now().toString(),
      symbol: selectedSymbol,
      type: orderType,
      side,
      size: orderSize,
      price: orderType !== 'market' ? orderPrice : undefined,
      status: orderType === 'market' ? 'filled' : 'pending',
      timestamp: Date.now()
    };

    setOrders(prev => [newOrder, ...prev]);

    if (orderType === 'market') {
      const newPosition: Position = {
        id: Date.now().toString(),
        symbol: selectedSymbol,
        side: side === 'buy' ? 'long' : 'short',
        size: orderSize,
        entryPrice: executePrice,
        currentPrice: executePrice,
        pnl: 0,
        pnlPercent: 0,
        timestamp: Date.now()
      };
      
      setPositions(prev => [newPosition, ...prev]);
    }
  };

  const closePosition = (positionId: string) => {
    setPositions(prev => prev.filter(pos => pos.id !== positionId));
  };

  const totalPnL = positions.reduce((sum, pos) => sum + pos.pnl, 0);

  return (
    <div className="bg-trading-surface rounded-lg border border-trading-border p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center space-x-3">
          <Activity className="w-6 h-6 text-trading-green" />
          <div>
            <h2 className="text-lg font-semibold text-trading-text">Live Trading</h2>
            <div className="text-sm text-trading-muted">Execute real-time trades</div>
          </div>
        </div>
        <div className={`text-right ${totalPnL >= 0 ? 'text-trading-green' : 'text-trading-red'}`}>
          <div className="text-sm text-trading-muted">Total P&L</div>
          <div className="font-mono font-bold text-lg">
            {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Order Entry */}
      <div className="bg-trading-bg rounded-lg p-4 mb-4 border border-trading-border">
        <h3 className="text-trading-text font-semibold mb-3">Place Order</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <select 
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            className="bg-trading-surface border border-trading-border rounded px-3 py-2 text-trading-text"
          >
            {Object.keys(marketAssets).slice(0, 8).map(symbol => (
              <option key={symbol} value={symbol}>{symbol}</option>
            ))}
          </select>
          
          <select 
            value={orderType}
            onChange={(e) => setOrderType(e.target.value as any)}
            className="bg-trading-surface border border-trading-border rounded px-3 py-2 text-trading-text"
          >
            <option value="market">Market</option>
            <option value="limit">Limit</option>
            <option value="stop">Stop</option>
          </select>
          
          <input
            type="number"
            value={orderSize}
            onChange={(e) => setOrderSize(Number(e.target.value))}
            placeholder="Size"
            className="bg-trading-surface border border-trading-border rounded px-3 py-2 text-trading-text"
            step="0.01"
          />
          
          {orderType !== 'market' && (
            <input
              type="number"
              value={orderPrice}
              onChange={(e) => setOrderPrice(Number(e.target.value))}
              placeholder="Price"
              className="bg-trading-surface border border-trading-border rounded px-3 py-2 text-trading-text"
              step="0.01"
            />
          )}
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => executeOrder('buy')}
            className="flex-1 bg-trading-green hover:bg-trading-green/80 text-white font-semibold py-2 px-4 rounded transition-colors"
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            Buy / Long
          </button>
          <button
            onClick={() => executeOrder('sell')}
            className="flex-1 bg-trading-red hover:bg-trading-red/80 text-white font-semibold py-2 px-4 rounded transition-colors"
          >
            <TrendingDown className="w-4 h-4 inline mr-2" />
            Sell / Short
          </button>
        </div>
      </div>

      {/* Positions */}
      <div className="mb-4">
        <h3 className="text-trading-text font-semibold mb-3">Open Positions ({positions.length})</h3>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {positions.map(position => (
            <div key={position.id} className="bg-trading-bg rounded p-3 border border-trading-border">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <span className="font-bold text-trading-text">{position.symbol}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    position.side === 'long' ? 'bg-trading-green/20 text-trading-green' : 'bg-trading-red/20 text-trading-red'
                  }`}>
                    {position.side.toUpperCase()}
                  </span>
                  <span className="text-trading-muted text-sm">{position.size}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className={`font-mono font-bold ${position.pnl >= 0 ? 'text-trading-green' : 'text-trading-red'}`}>
                      {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(2)}
                    </div>
                    <div className={`text-xs ${position.pnlPercent >= 0 ? 'text-trading-green' : 'text-trading-red'}`}>
                      {position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%
                    </div>
                  </div>
                  <button
                    onClick={() => closePosition(position.id)}
                    className="bg-trading-red/20 hover:bg-trading-red/30 text-trading-red px-2 py-1 rounded text-xs transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {positions.length === 0 && (
            <div className="text-center text-trading-muted py-4">
              No open positions
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div>
        <h3 className="text-trading-text font-semibold mb-3">Recent Orders</h3>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {orders.slice(0, 5).map(order => (
            <div key={order.id} className="bg-trading-bg rounded p-2 border border-trading-border text-sm">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="text-trading-text font-medium">{order.symbol}</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    order.side === 'buy' ? 'bg-trading-green/20 text-trading-green' : 'bg-trading-red/20 text-trading-red'
                  }`}>
                    {order.side.toUpperCase()}
                  </span>
                  <span className="text-trading-muted">{order.size}</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  order.status === 'filled' ? 'bg-trading-green/20 text-trading-green' :
                  order.status === 'pending' ? 'bg-trading-yellow/20 text-trading-yellow' :
                  'bg-trading-red/20 text-trading-red'
                }`}>
                  {order.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LiveTradingPanel;
