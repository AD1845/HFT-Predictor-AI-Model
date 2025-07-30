import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface StrategySignal {
  strategy: string;
  symbol: string;
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  entry_price: number;
  target_price: number;
  stop_loss: number;
  expected_return: number;
  risk_score: number;
  timestamp: string;
  metadata: any;
}

export interface StrategyPerformance {
  strategy: string;
  total_signals: number;
  winning_signals: number;
  win_rate: number;
  avg_return: number;
  sharpe_ratio: number;
  max_drawdown: number;
  profit_factor: number;
  avg_hold_time: number; // minutes
}

export const useAdvancedHFTStrategies = (symbols: string[]) => {
  const [signals, setSignals] = useState<StrategySignal[]>([]);
  const [performance, setPerformance] = useState<StrategyPerformance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const priceBuffer = useRef<Map<string, number[]>>(new Map());
  const volumeBuffer = useRef<Map<string, number[]>>(new Map());
  const orderBookBuffer = useRef<Map<string, any[]>>(new Map());

  // Strategy 1: Mean Reversion with Bollinger Bands
  const meanReversionStrategy = useCallback((symbol: string, prices: number[], volumes: number[]): StrategySignal | null => {
    if (prices.length < 20) return null;

    const period = 20;
    const stdDev = 2;
    
    // Calculate moving average and standard deviation
    const recentPrices = prices.slice(-period);
    const sma = recentPrices.reduce((a, b) => a + b) / period;
    const variance = recentPrices.reduce((acc, price) => acc + Math.pow(price - sma, 2), 0) / period;
    const stdDeviation = Math.sqrt(variance);
    
    const upperBand = sma + (stdDev * stdDeviation);
    const lowerBand = sma - (stdDev * stdDeviation);
    const currentPrice = prices[prices.length - 1];
    
    // Mean reversion signals
    if (currentPrice <= lowerBand) {
      return {
        strategy: 'Mean Reversion',
        symbol,
        signal: 'BUY',
        confidence: Math.min(95, 60 + ((lowerBand - currentPrice) / lowerBand) * 100),
        entry_price: currentPrice,
        target_price: sma,
        stop_loss: currentPrice * 0.98,
        expected_return: ((sma - currentPrice) / currentPrice) * 100,
        risk_score: 3,
        timestamp: new Date().toISOString(),
        metadata: { sma, upperBand, lowerBand, stdDeviation }
      };
    } else if (currentPrice >= upperBand) {
      return {
        strategy: 'Mean Reversion',
        symbol,
        signal: 'SELL',
        confidence: Math.min(95, 60 + ((currentPrice - upperBand) / upperBand) * 100),
        entry_price: currentPrice,
        target_price: sma,
        stop_loss: currentPrice * 1.02,
        expected_return: ((currentPrice - sma) / currentPrice) * 100,
        risk_score: 3,
        timestamp: new Date().toISOString(),
        metadata: { sma, upperBand, lowerBand, stdDeviation }
      };
    }
    
    return null;
  }, []);

  // Strategy 2: Momentum with RSI and MACD
  const momentumStrategy = useCallback((symbol: string, prices: number[]): StrategySignal | null => {
    if (prices.length < 26) return null;

    const currentPrice = prices[prices.length - 1];
    
    // RSI calculation
    const rsiPeriod = 14;
    const gains: number[] = [];
    const losses: number[] = [];
    
    for (let i = prices.length - rsiPeriod; i < prices.length - 1; i++) {
      const change = prices[i + 1] - prices[i];
      if (change > 0) {
        gains.push(change);
        losses.push(0);
      } else {
        gains.push(0);
        losses.push(-change);
      }
    }
    
    const avgGain = gains.reduce((a, b) => a + b) / rsiPeriod;
    const avgLoss = losses.reduce((a, b) => a + b) / rsiPeriod;
    const rs = avgGain / (avgLoss || 0.001);
    const rsi = 100 - (100 / (1 + rs));
    
    // MACD calculation
    const ema12 = calculateEMA(prices.slice(-12), 12);
    const ema26 = calculateEMA(prices.slice(-26), 26);
    const macd = ema12 - ema26;
    
    // Momentum signals
    if (rsi < 30 && macd > 0) {
      return {
        strategy: 'Momentum',
        symbol,
        signal: 'BUY',
        confidence: Math.min(90, 50 + (30 - rsi) + Math.abs(macd) * 10),
        entry_price: currentPrice,
        target_price: currentPrice * 1.03,
        stop_loss: currentPrice * 0.97,
        expected_return: 3,
        risk_score: 4,
        timestamp: new Date().toISOString(),
        metadata: { rsi, macd, ema12, ema26 }
      };
    } else if (rsi > 70 && macd < 0) {
      return {
        strategy: 'Momentum',
        symbol,
        signal: 'SELL',
        confidence: Math.min(90, 50 + (rsi - 70) + Math.abs(macd) * 10),
        entry_price: currentPrice,
        target_price: currentPrice * 0.97,
        stop_loss: currentPrice * 1.03,
        expected_return: 3,
        risk_score: 4,
        timestamp: new Date().toISOString(),
        metadata: { rsi, macd, ema12, ema26 }
      };
    }
    
    return null;
  }, []);

  // Strategy 3: Volume Weighted Average Price (VWAP) Breakout
  const vwapBreakoutStrategy = useCallback((symbol: string, prices: number[], volumes: number[]): StrategySignal | null => {
    if (prices.length < 10 || volumes.length < 10) return null;

    const currentPrice = prices[prices.length - 1];
    const currentVolume = volumes[volumes.length - 1];
    
    // Calculate VWAP
    let totalPV = 0;
    let totalVolume = 0;
    const lookback = Math.min(20, prices.length);
    
    for (let i = prices.length - lookback; i < prices.length; i++) {
      totalPV += prices[i] * volumes[i];
      totalVolume += volumes[i];
    }
    
    const vwap = totalPV / totalVolume;
    const avgVolume = volumes.slice(-lookback).reduce((a, b) => a + b) / lookback;
    const volumeRatio = currentVolume / avgVolume;
    
    // VWAP breakout with volume confirmation
    if (currentPrice > vwap * 1.002 && volumeRatio > 1.5) {
      return {
        strategy: 'VWAP Breakout',
        symbol,
        signal: 'BUY',
        confidence: Math.min(85, 60 + Math.min(20, volumeRatio * 5)),
        entry_price: currentPrice,
        target_price: currentPrice * 1.015,
        stop_loss: vwap * 0.999,
        expected_return: 1.5,
        risk_score: 2,
        timestamp: new Date().toISOString(),
        metadata: { vwap, volumeRatio, avgVolume }
      };
    } else if (currentPrice < vwap * 0.998 && volumeRatio > 1.5) {
      return {
        strategy: 'VWAP Breakout',
        symbol,
        signal: 'SELL',
        confidence: Math.min(85, 60 + Math.min(20, volumeRatio * 5)),
        entry_price: currentPrice,
        target_price: currentPrice * 0.985,
        stop_loss: vwap * 1.001,
        expected_return: 1.5,
        risk_score: 2,
        timestamp: new Date().toISOString(),
        metadata: { vwap, volumeRatio, avgVolume }
      };
    }
    
    return null;
  }, []);

  // Strategy 4: Statistical Arbitrage (Pairs Trading)
  const statisticalArbitrageStrategy = useCallback((): StrategySignal[] => {
    const signals: StrategySignal[] = [];
    
    // Define correlated pairs
    const pairs = [
      ['AAPL', 'MSFT'], ['GOOGL', 'META'], ['JPM', 'BAC'], 
      ['XOM', 'CVX'], ['KO', 'PEP'], ['BTC/USD', 'ETH/USD']
    ];
    
    pairs.forEach(([symbol1, symbol2]) => {
      const prices1 = priceBuffer.current.get(symbol1) || [];
      const prices2 = priceBuffer.current.get(symbol2) || [];
      
      if (prices1.length < 30 || prices2.length < 30) return;
      
      // Calculate spread and z-score
      const spread = prices1.map((p1, i) => p1 - prices2[i] * (prices1[0] / prices2[0]));
      const avgSpread = spread.reduce((a, b) => a + b) / spread.length;
      const stdSpread = Math.sqrt(spread.reduce((acc, s) => acc + Math.pow(s - avgSpread, 2), 0) / spread.length);
      const currentSpread = spread[spread.length - 1];
      const zScore = (currentSpread - avgSpread) / stdSpread;
      
      if (Math.abs(zScore) > 2) {
        const currentPrice1 = prices1[prices1.length - 1];
        const currentPrice2 = prices2[prices2.length - 1];
        
        if (zScore > 2) {
          // Short symbol1, Long symbol2
          signals.push({
            strategy: 'Statistical Arbitrage',
            symbol: symbol1,
            signal: 'SELL',
            confidence: Math.min(80, 60 + Math.abs(zScore) * 5),
            entry_price: currentPrice1,
            target_price: currentPrice1 * 0.99,
            stop_loss: currentPrice1 * 1.005,
            expected_return: 1,
            risk_score: 1,
            timestamp: new Date().toISOString(),
            metadata: { pair: symbol2, zScore, spread: currentSpread }
          });
        } else if (zScore < -2) {
          // Long symbol1, Short symbol2
          signals.push({
            strategy: 'Statistical Arbitrage',
            symbol: symbol1,
            signal: 'BUY',
            confidence: Math.min(80, 60 + Math.abs(zScore) * 5),
            entry_price: currentPrice1,
            target_price: currentPrice1 * 1.01,
            stop_loss: currentPrice1 * 0.995,
            expected_return: 1,
            risk_score: 1,
            timestamp: new Date().toISOString(),
            metadata: { pair: symbol2, zScore, spread: currentSpread }
          });
        }
      }
    });
    
    return signals;
  }, []);

  // Strategy 5: Order Flow Imbalance
  const orderFlowStrategy = useCallback((symbol: string): StrategySignal | null => {
    const orderBooks = orderBookBuffer.current.get(symbol) || [];
    if (orderBooks.length < 3) return null;
    
    const latestBook = orderBooks[orderBooks.length - 1];
    if (!latestBook?.bids || !latestBook?.asks) return null;
    
    // Calculate order flow imbalance
    const bidVolume = latestBook.bids.slice(0, 5).reduce((sum: number, level: any) => sum + level[1], 0);
    const askVolume = latestBook.asks.slice(0, 5).reduce((sum: number, level: any) => sum + level[1], 0);
    const imbalance = (bidVolume - askVolume) / (bidVolume + askVolume);
    
    const currentPrice = (latestBook.bids[0][0] + latestBook.asks[0][0]) / 2;
    
    if (Math.abs(imbalance) > 0.3) {
      return {
        strategy: 'Order Flow',
        symbol,
        signal: imbalance > 0 ? 'BUY' : 'SELL',
        confidence: Math.min(75, 50 + Math.abs(imbalance) * 60),
        entry_price: currentPrice,
        target_price: currentPrice * (1 + (imbalance > 0 ? 0.005 : -0.005)),
        stop_loss: currentPrice * (1 + (imbalance > 0 ? -0.002 : 0.002)),
        expected_return: 0.5,
        risk_score: 5,
        timestamp: new Date().toISOString(),
        metadata: { imbalance, bidVolume, askVolume }
      };
    }
    
    return null;
  }, []);

  const runAllStrategies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch real-time data
      const { data: realtimeData, error: rtError } = await supabase.functions.invoke('real-time-hft-data', {
        body: { symbols, realtime: true }
      });

      if (rtError) throw rtError;

      // Update price and volume buffers
      realtimeData.data?.forEach((item: any) => {
        if (!item.error) {
          // Update price buffer
          const prices = priceBuffer.current.get(item.symbol) || [];
          prices.push(item.price);
          if (prices.length > 100) prices.shift();
          priceBuffer.current.set(item.symbol, prices);

          // Update volume buffer
          const volumes = volumeBuffer.current.get(item.symbol) || [];
          volumes.push(item.volume);
          if (volumes.length > 100) volumes.shift();
          volumeBuffer.current.set(item.symbol, volumes);
        }
      });

      // Fetch order book data
      const { data: orderBookData } = await supabase
        .from('order_book_data')
        .select('*')
        .in('symbol', symbols)
        .order('timestamp', { ascending: false })
        .limit(symbols.length * 3);

      // Update order book buffer
      orderBookData?.forEach((book: any) => {
        const books = orderBookBuffer.current.get(book.symbol) || [];
        books.push(book);
        if (books.length > 10) books.shift();
        orderBookBuffer.current.set(book.symbol, books);
      });

      // Run all strategies
      const allSignals: StrategySignal[] = [];

      symbols.forEach(symbol => {
        const prices = priceBuffer.current.get(symbol) || [];
        const volumes = volumeBuffer.current.get(symbol) || [];

        if (prices.length > 0) {
          // Run individual strategies
          const meanRevSignal = meanReversionStrategy(symbol, prices, volumes);
          const momentumSignal = momentumStrategy(symbol, prices);
          const vwapSignal = vwapBreakoutStrategy(symbol, prices, volumes);
          const orderFlowSignal = orderFlowStrategy(symbol);

          [meanRevSignal, momentumSignal, vwapSignal, orderFlowSignal].forEach(signal => {
            if (signal) allSignals.push(signal);
          });
        }
      });

      // Add statistical arbitrage signals
      const statArbSignals = statisticalArbitrageStrategy();
      allSignals.push(...statArbSignals);

      setSignals(allSignals);
      updatePerformanceMetrics(allSignals);

    } catch (err) {
      console.error('Strategy execution error:', err);
      setError(err instanceof Error ? err.message : 'Strategy execution failed');
    } finally {
      setLoading(false);
    }
  }, [symbols, meanReversionStrategy, momentumStrategy, vwapBreakoutStrategy, orderFlowStrategy, statisticalArbitrageStrategy]);

  const updatePerformanceMetrics = useCallback((allSignals: StrategySignal[]) => {
    const strategies = ['Mean Reversion', 'Momentum', 'VWAP Breakout', 'Statistical Arbitrage', 'Order Flow'];
    const performanceData: StrategyPerformance[] = [];

    strategies.forEach(strategy => {
      const strategySignals = allSignals.filter(s => s.strategy === strategy);
      const totalSignals = strategySignals.length;
      
      if (totalSignals > 0) {
        // Simulate performance metrics
        const winRate = 55 + Math.random() * 25; // 55-80%
        const winningSignals = Math.floor(totalSignals * (winRate / 100));
        const avgReturn = (Math.random() * 3) + 0.5; // 0.5-3.5%
        
        performanceData.push({
          strategy,
          total_signals: totalSignals,
          winning_signals: winningSignals,
          win_rate: winRate,
          avg_return: avgReturn,
          sharpe_ratio: 1.2 + Math.random() * 1.8,
          max_drawdown: -(Math.random() * 8 + 2),
          profit_factor: 1.1 + Math.random() * 1.4,
          avg_hold_time: Math.random() * 180 + 30 // 30-210 minutes
        });
      }
    });

    setPerformance(performanceData);
  }, []);

  useEffect(() => {
    const interval = setInterval(runAllStrategies, 5000); // Run every 5 seconds
    runAllStrategies(); // Initial run
    
    return () => clearInterval(interval);
  }, [runAllStrategies]);

  return {
    signals,
    performance,
    loading,
    error,
    refetch: runAllStrategies
  };
};

function calculateEMA(prices: number[], period: number): number {
  const k = 2 / (period + 1);
  return prices.reduce((ema, price, index) => {
    return index === 0 ? price : price * k + ema * (1 - k);
  }, prices[0]);
}