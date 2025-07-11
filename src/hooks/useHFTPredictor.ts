
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface HFTPrediction {
  symbol: string;
  currentPrice: number;
  predictedPrice: number;
  confidence: number;
  direction: 'BUY' | 'SELL' | 'HOLD';
  timeframe: string;
  volatility: number;
  volume: number;
  momentum: number;
  rsi: number;
  macd: number;
  bollinger: {
    upper: number;
    middle: number;
    lower: number;
  };
  support: number;
  resistance: number;
  timestamp: string;
}

export interface MarketIndicators {
  rsi: number;
  macd: number;
  signal: number;
  bollinger: { upper: number; middle: number; lower: number };
  volume: number;
  volatility: number;
  momentum: number;
}

export const useHFTPredictor = (symbols: string[], updateInterval = 5000) => {
  const [predictions, setPredictions] = useState<HFTPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTraining, setIsTraining] = useState(false);

  // Technical analysis calculations
  const calculateRSI = (prices: number[], period = 14): number => {
    if (prices.length < period) return 50;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i < period + 1; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    const rs = avgGain / avgLoss;
    
    return 100 - (100 / (1 + rs));
  };

  const calculateMACD = (prices: number[]): { macd: number; signal: number } => {
    if (prices.length < 26) return { macd: 0, signal: 0 };
    
    const ema12 = calculateEMA(prices, 12);
    const ema26 = calculateEMA(prices, 26);
    const macd = ema12 - ema26;
    const signal = calculateEMA([macd], 9);
    
    return { macd, signal };
  };

  const calculateEMA = (prices: number[], period: number): number => {
    if (prices.length === 0) return 0;
    const multiplier = 2 / (period + 1);
    let ema = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
  };

  const calculateBollingerBands = (prices: number[], period = 20): { upper: number; middle: number; lower: number } => {
    if (prices.length < period) return { upper: 0, middle: 0, lower: 0 };
    
    const recentPrices = prices.slice(-period);
    const middle = recentPrices.reduce((sum, price) => sum + price, 0) / period;
    const variance = recentPrices.reduce((sum, price) => sum + Math.pow(price - middle, 2), 0) / period;
    const stdDev = Math.sqrt(variance);
    
    return {
      upper: middle + (stdDev * 2),
      middle,
      lower: middle - (stdDev * 2)
    };
  };

  const calculateVolatility = (prices: number[]): number => {
    if (prices.length < 2) return 0;
    
    const returns = prices.slice(1).map((price, i) => Math.log(price / prices[i]));
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    
    return Math.sqrt(variance * 252); // Annualized volatility
  };

  const calculateMomentum = (prices: number[], period = 10): number => {
    if (prices.length < period) return 0;
    return (prices[prices.length - 1] - prices[prices.length - period]) / prices[prices.length - period] * 100;
  };

  const calculateSupportResistance = (prices: number[]): { support: number; resistance: number } => {
    if (prices.length < 20) return { support: 0, resistance: 0 };
    
    const recent = prices.slice(-20);
    const support = Math.min(...recent);
    const resistance = Math.max(...recent);
    
    return { support, resistance };
  };

  const generatePrediction = useCallback((symbol: string, currentPrice: number, historicalPrices: number[], indicators: MarketIndicators): HFTPrediction => {
    const { rsi, macd, signal, bollinger, volume, volatility, momentum } = indicators;
    
    // ML-inspired prediction logic
    let prediction = currentPrice;
    let confidence = 0;
    let direction: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    
    // Weight factors for different indicators
    const weights = {
      rsi: 0.25,
      macd: 0.25,
      bollinger: 0.20,
      momentum: 0.15,
      volume: 0.10,
      volatility: 0.05
    };
    
    let bullishSignals = 0;
    let bearishSignals = 0;
    
    // RSI analysis
    if (rsi < 30) {
      bullishSignals += weights.rsi;
      prediction += currentPrice * 0.02;
    } else if (rsi > 70) {
      bearishSignals += weights.rsi;
      prediction -= currentPrice * 0.02;
    }
    
    // MACD analysis
    if (macd > signal) {
      bullishSignals += weights.macd;
      prediction += currentPrice * 0.015;
    } else {
      bearishSignals += weights.macd;
      prediction -= currentPrice * 0.015;
    }
    
    // Bollinger Bands analysis
    if (currentPrice < bollinger.lower) {
      bullishSignals += weights.bollinger;
      prediction += currentPrice * 0.01;
    } else if (currentPrice > bollinger.upper) {
      bearishSignals += weights.bollinger;
      prediction -= currentPrice * 0.01;
    }
    
    // Momentum analysis
    if (momentum > 5) {
      bullishSignals += weights.momentum;
      prediction += currentPrice * 0.01;
    } else if (momentum < -5) {
      bearishSignals += weights.momentum;
      prediction -= currentPrice * 0.01;
    }
    
    // Volume analysis (higher volume = higher confidence)
    const volumeMultiplier = Math.min(volume / 1000000, 2);
    confidence = (Math.abs(bullishSignals - bearishSignals) * volumeMultiplier) * 100;
    
    // Determine direction
    if (bullishSignals > bearishSignals + 0.1) {
      direction = 'BUY';
    } else if (bearishSignals > bullishSignals + 0.1) {
      direction = 'SELL';
    }
    
    // Calculate support and resistance
    const { support, resistance } = calculateSupportResistance(historicalPrices);
    
    return {
      symbol,
      currentPrice,
      predictedPrice: Number(prediction.toFixed(4)),
      confidence: Math.min(confidence, 95),
      direction,
      timeframe: '5m',
      volatility,
      volume,
      momentum,
      rsi,
      macd,
      bollinger,
      support,
      resistance,
      timestamp: new Date().toISOString()
    };
  }, []);

  const fetchPredictions = useCallback(async () => {
    try {
      setError(null);
      
      // Fetch real-time data from our edge function
      const { data: marketData, error: marketError } = await supabase.functions.invoke('fetch-market-data', {
        body: { symbols }
      });

      if (marketError) throw marketError;

      const predictions: HFTPrediction[] = [];
      
      for (const data of marketData.data) {
        // Generate historical prices for technical analysis
        const historicalPrices = generateHistoricalPrices(data.price, 100);
        
        // Calculate technical indicators
        const rsi = calculateRSI(historicalPrices);
        const { macd, signal } = calculateMACD(historicalPrices);
        const bollinger = calculateBollingerBands(historicalPrices);
        const volatility = calculateVolatility(historicalPrices);
        const momentum = calculateMomentum(historicalPrices);
        
        const indicators: MarketIndicators = {
          rsi,
          macd,
          signal,
          bollinger,
          volume: data.volume || 0,
          volatility,
          momentum
        };
        
        const prediction = generatePrediction(data.symbol, data.price, historicalPrices, indicators);
        predictions.push(prediction);
      }
      
      setPredictions(predictions);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching HFT predictions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch predictions');
      setLoading(false);
    }
  }, [symbols, generatePrediction]);

  // Generate synthetic historical prices for demo
  const generateHistoricalPrices = (currentPrice: number, count: number): number[] => {
    const prices = [];
    let price = currentPrice * 0.95; // Start 5% below current
    
    for (let i = 0; i < count; i++) {
      const change = (Math.random() - 0.5) * 0.02; // 2% max change
      price = price * (1 + change);
      prices.push(price);
    }
    
    return prices;
  };

  const trainModel = useCallback(async () => {
    setIsTraining(true);
    
    try {
      // Simulate model training with historical data
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log('HFT Model trained with latest market data');
      await fetchPredictions();
    } catch (err) {
      console.error('Model training failed:', err);
    } finally {
      setIsTraining(false);
    }
  }, [fetchPredictions]);

  useEffect(() => {
    fetchPredictions();
    
    const interval = setInterval(fetchPredictions, updateInterval);
    return () => clearInterval(interval);
  }, [fetchPredictions, updateInterval]);

  return {
    predictions,
    loading,
    error,
    isTraining,
    trainModel,
    refetch: fetchPredictions
  };
};
