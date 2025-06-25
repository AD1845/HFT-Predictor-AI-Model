
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useToast } from './ui/use-toast';
import { validateTradeInput, validateTradingAmount, validateSymbol, sanitizeInput, apiRateLimit } from '../utils/security';
import { Shield, AlertTriangle } from 'lucide-react';

interface SecureTradingFormProps {
  onSubmit: (trade: { symbol: string; amount: number; type: 'buy' | 'sell' }) => void;
}

const SecureTradingForm: React.FC<SecureTradingFormProps> = ({ onSubmit }) => {
  const [symbol, setSymbol] = useState('');
  const [amount, setAmount] = useState('');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate symbol
    const sanitizedSymbol = sanitizeInput(symbol);
    if (!validateSymbol(sanitizedSymbol)) {
      newErrors.symbol = 'Invalid trading symbol format';
    }

    // Validate amount
    const numAmount = parseFloat(amount);
    if (!validateTradingAmount(numAmount)) {
      newErrors.amount = 'Invalid trading amount (must be positive and under $1M)';
    }

    // Check for malicious input
    if (!validateTradeInput(symbol) || !validateTradeInput(amount)) {
      newErrors.general = 'Invalid characters detected in input';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Rate limiting check
    if (!apiRateLimit.isAllowed('trading_form')) {
      toast({
        title: 'Rate Limit Exceeded',
        description: 'Too many requests. Please wait before submitting again.',
        variant: 'destructive',
      });
      return;
    }

    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please correct the errors in the form',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const trade = {
        symbol: sanitizeInput(symbol).toUpperCase(),
        amount: parseFloat(amount),
        type: tradeType,
      };

      // Additional security check before execution
      if (trade.amount > 10000) {
        const confirmed = window.confirm(
          `You are about to ${tradeType} $${trade.amount.toLocaleString()} of ${trade.symbol}. This is a large trade. Are you sure?`
        );
        if (!confirmed) {
          setIsLoading(false);
          return;
        }
      }

      await onSubmit(trade);
      
      toast({
        title: 'Trade Executed',
        description: `Successfully ${tradeType === 'buy' ? 'bought' : 'sold'} $${trade.amount.toLocaleString()} of ${trade.symbol}`,
      });

      // Reset form
      setSymbol('');
      setAmount('');
    } catch (error) {
      console.error('Trade execution error:', error);
      toast({
        title: 'Trade Failed',
        description: 'Failed to execute trade. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-trading-surface rounded-lg border border-trading-border p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Shield className="w-5 h-5 text-trading-green" />
        <h3 className="text-lg font-semibold text-trading-text">Secure Trading</h3>
      </div>

      {errors.general && (
        <div className="mb-4 p-3 bg-trading-red/10 border border-trading-red/20 rounded-lg flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-trading-red" />
          <span className="text-trading-red text-sm">{errors.general}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="symbol" className="block text-sm font-medium text-trading-text">
            Trading Symbol
          </label>
          <Input
            id="symbol"
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="BTC/USD"
            className={`bg-trading-bg border-trading-border ${errors.symbol ? 'border-trading-red' : ''}`}
            maxLength={10}
            pattern="[A-Z/]+"
            required
          />
          {errors.symbol && (
            <p className="text-sm font-medium text-trading-red">{errors.symbol}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="amount" className="block text-sm font-medium text-trading-text">
            Amount ($)
          </label>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="1000"
            className={`bg-trading-bg border-trading-border ${errors.amount ? 'border-trading-red' : ''}`}
            min="0.01"
            max="1000000"
            step="0.01"
            required
          />
          {errors.amount && (
            <p className="text-sm font-medium text-trading-red">{errors.amount}</p>
          )}
        </div>

        <div className="flex space-x-2">
          <Button
            type="button"
            variant={tradeType === 'buy' ? 'default' : 'outline'}
            onClick={() => setTradeType('buy')}
            className={tradeType === 'buy' ? 'bg-trading-green hover:bg-trading-green/80' : ''}
          >
            Buy
          </Button>
          <Button
            type="button"
            variant={tradeType === 'sell' ? 'default' : 'outline'}
            onClick={() => setTradeType('sell')}
            className={tradeType === 'sell' ? 'bg-trading-red hover:bg-trading-red/80' : ''}
          >
            Sell
          </Button>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-trading-blue hover:bg-trading-blue/80"
        >
          {isLoading ? 'Executing...' : `Execute ${tradeType.toUpperCase()} Order`}
        </Button>
      </form>

      <div className="mt-4 p-3 bg-trading-bg/50 rounded-lg">
        <div className="text-xs text-trading-muted">
          <div className="flex items-center space-x-1 mb-1">
            <Shield className="w-3 h-3" />
            <span>Security Features Active:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Input validation and sanitization</li>
            <li>Rate limiting protection</li>
            <li>Large trade confirmation</li>
            <li>XSS protection enabled</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SecureTradingForm;
