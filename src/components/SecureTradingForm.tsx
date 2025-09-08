
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useToast } from './ui/use-toast';
import { validateTradeInput, sanitizeInput, validateTradingAmount, validateSymbol, clientRateLimit } from '../utils/security';
import { supabase } from '@/integrations/supabase/client';
import { Shield, AlertTriangle, HelpCircle, TrendingUp, DollarSign, Info } from 'lucide-react';
import { marketAssets } from '../utils/hftData';

interface SecureTradingFormProps {
  onSubmit: (trade: { symbol: string; amount: number; type: 'buy' | 'sell' }) => void;
}

const SecureTradingForm: React.FC<SecureTradingFormProps> = ({ onSubmit }) => {
  const [symbol, setSymbol] = useState('');
  const [amount, setAmount] = useState('');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showHelp, setShowHelp] = useState(false);
  const [selectedAssetInfo, setSelectedAssetInfo] = useState<any>(null);
  const { toast } = useToast();

  // Get popular symbols for quick selection
  const popularSymbols = [
    'AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'NVDA', 'META', 'BTC/USD', 'ETH/USD', 'SPY'
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate symbol
    const sanitizedSymbol = sanitizeInput(symbol);
    if (!validateSymbol(sanitizedSymbol)) {
      newErrors.symbol = 'Invalid trading symbol format';
    }

    // Check if symbol exists in our market data
    if (sanitizedSymbol && !marketAssets[sanitizedSymbol as keyof typeof marketAssets]) {
      newErrors.symbol = 'Symbol not found in available markets';
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

  const handleSymbolChange = (newSymbol: string) => {
    const upperSymbol = newSymbol.toUpperCase();
    setSymbol(upperSymbol);
    
    // Show asset info if it exists
    const asset = marketAssets[upperSymbol as keyof typeof marketAssets];
    if (asset) {
      setSelectedAssetInfo({
        symbol: upperSymbol,
        ...asset
      });
    } else {
      setSelectedAssetInfo(null);
    }
  };

  const handleQuickSymbolSelect = (selectedSymbol: string) => {
    handleSymbolChange(selectedSymbol);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Rate limiting check
    if (!clientRateLimit.isAllowed('trading_form')) {
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
      const sanitizedSymbol = sanitizeInput(symbol).toUpperCase();
      const numericAmount = parseFloat(amount);
      
      // Additional security check before execution
      if (numericAmount > 10000) {
        const confirmed = window.confirm(
          `You are about to ${tradeType} $${numericAmount.toLocaleString()} of ${sanitizedSymbol}. This is a large trade. Are you sure?`
        );
        if (!confirmed) {
          setIsLoading(false);
          return;
        }
      }

      // Get current user from Supabase auth
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        toast({
          title: 'Authentication Required',
          description: 'You must be logged in to place trades. Please sign in first.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      // Store trade in database with proper user authentication
      const { error } = await supabase
        .from('trades')
        .insert({
          user_id: user.id, // Use authenticated user's ID
          symbol: sanitizedSymbol,
          trade_type: tradeType,
          amount: numericAmount,
          price: selectedAssetInfo?.basePrice || 0,
          status: 'pending'
        });

      if (error) {
        throw new Error(error.message);
      }

      const trade = {
        symbol: sanitizedSymbol,
        amount: numericAmount,
        type: tradeType,
      };

      await onSubmit(trade);
      
      toast({
        title: 'Trade Executed',
        description: `Successfully ${tradeType === 'buy' ? 'bought' : 'sold'} $${numericAmount.toLocaleString()} of ${sanitizedSymbol}`,
      });

      // Reset form
      setSymbol('');
      setAmount('');
      setSelectedAssetInfo(null);
    } catch (error: any) {
      console.error('Trade execution error:', error);
      toast({
        title: 'Trade Failed',
        description: error.message || 'Failed to execute trade. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-trading-surface rounded-lg border border-trading-border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-trading-green" />
          <h3 className="text-lg font-semibold text-trading-text">Secure Trading</h3>
        </div>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="flex items-center space-x-1 text-trading-muted hover:text-trading-text transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
          <span className="text-sm">Help</span>
        </button>
      </div>

      {showHelp && (
        <div className="mb-4 p-4 bg-trading-bg/50 rounded-lg border border-trading-border/50">
          <h4 className="font-medium text-trading-text mb-2 flex items-center space-x-2">
            <Info className="w-4 h-4 text-trading-blue" />
            <span>Trading Guide for Beginners</span>
          </h4>
          <div className="text-sm text-trading-muted space-y-2">
            <p><strong>1. Choose a Symbol:</strong> Select from stocks (AAPL, GOOGL), crypto (BTC/USD, ETH/USD), or other assets.</p>
            <p><strong>2. Enter Amount:</strong> Specify how much money you want to invest (minimum $0.01, maximum $1M).</p>
            <p><strong>3. Buy vs Sell:</strong> Buy if you think the price will go up, Sell if you think it will go down.</p>
            <p><strong>4. Security:</strong> All trades are validated and protected against malicious inputs.</p>
          </div>
        </div>
      )}

      {errors.general && (
        <div className="mb-4 p-3 bg-trading-red/10 border border-trading-red/20 rounded-lg flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-trading-red" />
          <span className="text-trading-red text-sm">{errors.general}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Quick Symbol Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-trading-text">
            Popular Assets (Click to Select)
          </label>
          <div className="grid grid-cols-5 gap-2">
            {popularSymbols.map((popularSymbol) => {
              const asset = marketAssets[popularSymbol as keyof typeof marketAssets];
              return (
                <button
                  key={popularSymbol}
                  type="button"
                  onClick={() => handleQuickSymbolSelect(popularSymbol)}
                  className={`p-2 rounded text-xs font-medium border transition-all duration-200 ${
                    symbol === popularSymbol
                      ? 'bg-trading-blue/20 text-trading-blue border-trading-blue/30'
                      : 'bg-trading-bg text-trading-muted border-trading-border hover:border-trading-blue/50 hover:text-trading-text'
                  }`}
                >
                  {popularSymbol}
                </button>
              );
            })}
          </div>
        </div>

        {/* Symbol Input */}
        <div className="space-y-2">
          <label htmlFor="symbol" className="block text-sm font-medium text-trading-text">
            Trading Symbol
            <span className="text-trading-muted font-normal ml-2">(e.g., AAPL, BTC/USD)</span>
          </label>
          <Input
            id="symbol"
            type="text"
            value={symbol}
            onChange={(e) => handleSymbolChange(e.target.value)}
            placeholder="Enter symbol (e.g., AAPL, BTC/USD)"
            className={`bg-trading-bg border-trading-border ${errors.symbol ? 'border-trading-red' : ''}`}
            maxLength={10}
            pattern="[A-Z/]+"
            required
          />
          {errors.symbol && (
            <p className="text-sm font-medium text-trading-red">{errors.symbol}</p>
          )}
        </div>

        {/* Asset Information */}
        {selectedAssetInfo && (
          <div className="p-3 bg-trading-bg/50 rounded-lg border border-trading-border/50">
            <div className="flex items-start space-x-3">
              <div className={`px-2 py-1 rounded text-xs font-medium border ${
                selectedAssetInfo.type === 'crypto' ? 'bg-trading-orange/10 text-trading-orange border-trading-orange/20' :
                selectedAssetInfo.type === 'stock' ? 'bg-trading-blue/10 text-trading-blue border-trading-blue/20' :
                selectedAssetInfo.type === 'forex' ? 'bg-trading-purple/10 text-trading-purple border-trading-purple/20' :
                'bg-trading-yellow/10 text-trading-yellow border-trading-yellow/20'
              }`}>
                {selectedAssetInfo.type?.toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="font-medium text-trading-text">{selectedAssetInfo.symbol}</div>
                <div className="text-sm text-trading-muted mt-1">{selectedAssetInfo.description}</div>
                <div className="text-xs text-trading-muted mt-1">
                  Sector: {selectedAssetInfo.sector} • Base Price: ${selectedAssetInfo.basePrice.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Amount Input */}
        <div className="space-y-2">
          <label htmlFor="amount" className="block text-sm font-medium text-trading-text">
            Investment Amount ($)
            <span className="text-trading-muted font-normal ml-2">(Min: $0.01, Max: $1,000,000)</span>
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-trading-muted" />
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1000"
              className={`pl-10 bg-trading-bg border-trading-border ${errors.amount ? 'border-trading-red' : ''}`}
              min="0.01"
              max="1000000"
              step="0.01"
              required
            />
          </div>
          {errors.amount && (
            <p className="text-sm font-medium text-trading-red">{errors.amount}</p>
          )}
          {amount && parseFloat(amount) > 0 && (
            <p className="text-xs text-trading-muted">
              You're investing ${parseFloat(amount).toLocaleString()} in {symbol || 'selected asset'}
            </p>
          )}
        </div>

        {/* Trade Type Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-trading-text">
            Trade Type
          </label>
          <div className="flex space-x-2">
            <Button
              type="button"
              variant={tradeType === 'buy' ? 'default' : 'outline'}
              onClick={() => setTradeType('buy')}
              className={`flex-1 ${tradeType === 'buy' ? 'bg-trading-green hover:bg-trading-green/80' : ''}`}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Buy (Long)
            </Button>
            <Button
              type="button"
              variant={tradeType === 'sell' ? 'default' : 'outline'}
              onClick={() => setTradeType('sell')}
              className={`flex-1 ${tradeType === 'sell' ? 'bg-trading-red hover:bg-trading-red/80' : ''}`}
            >
              <TrendingUp className="w-4 h-4 mr-2 rotate-180" />
              Sell (Short)
            </Button>
          </div>
          <div className="text-xs text-trading-muted">
            {tradeType === 'buy' 
              ? "Buy: You profit if the price goes up" 
              : "Sell: You profit if the price goes down"}
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading || !symbol || !amount}
          className="w-full bg-trading-blue hover:bg-trading-blue/80 disabled:opacity-50"
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
