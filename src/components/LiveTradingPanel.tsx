
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, Shield } from 'lucide-react';
import SecureTradingForm from './SecureTradingForm';
import { useToast } from './ui/use-toast';
import { useSecurity } from '../contexts/SecurityContext';

interface Position {
  id: number;
  symbol: string;
  amount: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  type: 'long' | 'short';
}

interface Trade {
  id: number;
  symbol: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  time: string;
  status: 'pending' | 'filled' | 'rejected';
}

const LiveTradingPanel = () => {
  const [marketData, setMarketData] = useState({
    'BTC/USD': { price: 45200, change: 0.01 },
    'ETH/USD': { price: 3190, change: -0.005 },
    'AAPL': { price: 152, change: 0.008 }
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMarketData(prev => {
        const newData = { ...prev };
        for (const symbol in newData) {
          const change = (Math.random() - 0.5) * 0.02;
          newData[symbol].price += newData[symbol].price * change;
          newData[symbol].change = change;
        }
        return newData;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const [positions, setPositions] = useState([
    { id: 1, symbol: 'BTC/USD', amount: 0.5, entryPrice: 45000, currentPrice: 45250, pnl: 125, type: 'long' },
    { id: 2, symbol: 'ETH/USD', amount: 2.5, entryPrice: 3200, currentPrice: 3180, pnl: -50, type: 'long' },
    { id: 3, symbol: 'AAPL', amount: 100, entryPrice: 150, currentPrice: 152, pnl: 200, type: 'long' }
  ]);

  const [recentTrades, setRecentTrades] = useState([
    { id: 1, symbol: 'BTC/USD', type: 'buy', amount: 0.1, price: 45200, time: '10:30:15', status: 'filled' },
    { id: 2, symbol: 'ETH/USD', type: 'sell', amount: 0.5, price: 3190, time: '10:28:42', status: 'filled' },
    { id: 3, symbol: 'TSLA', type: 'buy', amount: 50, price: 240, time: '10:25:18', status: 'pending' }
  ]);

  const { toast } = useToast();
  const { isAuthenticated, checkPermission } = useSecurity();

  const handleSecureTrade = async (trade: { symbol: string; amount: number; type: 'buy' | 'sell' }) => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to execute trades',
        variant: 'destructive',
      });
      return;
    }

    if (!checkPermission('execute_trades')) {
      toast({
        title: 'Permission Denied',
        description: 'You do not have permission to execute trades',
        variant: 'destructive',
      });
      return;
    }

    // Simulate trade execution
    const newTrade = {
      id: Date.now(),
      symbol: trade.symbol,
      type: trade.type,
      amount: trade.amount,
      price: Math.random() * 1000 + 100, // Simulated price
      time: new Date().toLocaleTimeString(),
      status: 'filled' as const
    };

    setRecentTrades(prev => [newTrade, ...prev.slice(0, 9)]);
    
    console.log('Secure trade executed:', trade);
  };

  return (
    <div className="space-y-6">
      {/* Security Status Banner */}
      <div className="bg-trading-green/10 border border-trading-green/20 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-trading-green" />
          <span className="text-trading-green font-medium">Secure Trading Environment Active</span>
        </div>
        <p className="text-trading-muted text-sm mt-1">
          All trades are validated, sanitized, and rate-limited for maximum security
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Secure Trading Form */}
        <SecureTradingForm onSubmit={handleSecureTrade} />

        <div className="bg-trading-surface rounded-lg border border-trading-border p-6">
          <h3 className="text-lg font-semibold text-trading-text mb-4">Active Positions</h3>
          <div className="space-y-3">
            {positions.map((position) => (
              <div key={position.id} className="bg-trading-bg rounded border border-trading-border/50 p-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-medium text-trading-text">{position.symbol}</span>
                    <span className={`ml-2 text-xs px-2 py-1 rounded ${
                      position.type === 'long' ? 'bg-trading-green/20 text-trading-green' : 'bg-trading-red/20 text-trading-red'
                    }`}>
                      {position.type.toUpperCase()}
                    </span>
                  </div>
                  <span className={`font-bold ${position.pnl >= 0 ? 'text-trading-green' : 'text-trading-red'}`}>
                    {position.pnl >= 0 ? '+' : ''}${position.pnl}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm text-trading-muted">
                  <div>Amount: {position.amount}</div>
                  <div>Entry: ${position.entryPrice}</div>
                  <div>Current: ${position.currentPrice}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-trading-surface rounded-lg border border-trading-border p-6">
        <h3 className="text-lg font-semibold text-trading-text mb-4">Recent Trades</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-trading-border/50">
              <tr className="text-trading-muted">
                <th className="text-left py-2">Symbol</th>
                <th className="text-left py-2">Type</th>
                <th className="text-right py-2">Amount</th>
                <th className="text-right py-2">Price</th>
                <th className="text-right py-2">Time</th>
                <th className="text-right py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentTrades.map((trade) => (
                <tr key={trade.id} className="border-b border-trading-border/30">
                  <td className="py-2 text-trading-text font-medium">{trade.symbol}</td>
                  <td className="py-2">
                    <span className={`flex items-center space-x-1 ${
                      trade.type === 'buy' ? 'text-trading-green' : 'text-trading-red'
                    }`}>
                      {trade.type === 'buy' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      <span className="capitalize">{trade.type}</span>
                    </span>
                  </td>
                  <td className="py-2 text-right text-trading-text">{trade.amount}</td>
                  <td className="py-2 text-right text-trading-text">${trade.price}</td>
                  <td className="py-2 text-right text-trading-muted">{trade.time}</td>
                  <td className="py-2 text-right">
                    <span className={`px-2 py-1 rounded text-xs ${
                      trade.status === 'filled' 
                        ? 'bg-trading-green/20 text-trading-green' 
                        : 'bg-trading-yellow/20 text-trading-yellow'
                    }`}>
                      {trade.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LiveTradingPanel;
