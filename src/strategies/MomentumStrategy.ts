import { TradingStrategy, TradeSignal, MarketData, RiskControls } from '../types/strategy';

export class MomentumStrategy extends TradingStrategy {
  private rsiOverbought: number;
  private rsiOversold: number;
  private macdThreshold: number;
  private vwapSensitivity: number;

  constructor(riskControls: RiskControls) {
    super('momentum', 'Momentum Trading', riskControls);
    this.rsiOverbought = 70;
    this.rsiOversold = 30;
    this.macdThreshold = 0.5;
    this.vwapSensitivity = 0.02; // 2% deviation from VWAP
  }

  async generateSignal(marketData: MarketData[]): Promise<TradeSignal[]> {
    const signals: TradeSignal[] = [];
    const startTime = Date.now();

    try {
      for (const data of marketData) {
        if (!data.indicators) continue;

        const momentumScore = this.calculateMomentumScore(data);
        const confirmation = this.getConfirmationSignals(data);
        
        let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
        let confidence = Math.abs(momentumScore) * confirmation.strength;
        let reason = '';

        if (momentumScore > 0.6 && confirmation.bullish >= 2) {
          action = 'BUY';
          reason = `Strong bullish momentum: ${confirmation.reasons.join(', ')}`;
        } else if (momentumScore < -0.6 && confirmation.bearish >= 2) {
          action = 'SELL';
          reason = `Strong bearish momentum: ${confirmation.reasons.join(', ')}`;
        } else if (momentumScore > 0.3 && confirmation.bullish >= 1) {
          action = 'BUY';
          confidence *= 0.7; // Lower confidence for weaker signals
          reason = `Moderate bullish momentum: ${confirmation.reasons.join(', ')}`;
        } else if (momentumScore < -0.3 && confirmation.bearish >= 1) {
          action = 'SELL';
          confidence *= 0.7;
          reason = `Moderate bearish momentum: ${confirmation.reasons.join(', ')}`;
        }

        // Volume confirmation is required for high-confidence signals
        if (action !== 'HOLD' && this.hasVolumeConfirmation(data)) {
          confidence *= 1.2;
        }

        if (action !== 'HOLD' && confidence > 0.3) {
          signals.push({
            symbol: data.symbol,
            action,
            confidence: Math.min(confidence, 0.95),
            quantity: this.calculateMomentumPositionSize(confidence, momentumScore),
            stopLoss: this.calculateDynamicStopLoss(data, action),
            takeProfit: this.calculateDynamicTakeProfit(data, action, momentumScore),
            reason,
            timestamp: new Date().toISOString()
          });
        }
      }

      const latency = Date.now() - startTime;
      if (signals.length > 0) {
        this.updatePerformance(0, latency);
      }

    } catch (error) {
      console.error('Momentum Strategy error:', error);
    }

    return signals;
  }

  private calculateMomentumScore(data: MarketData): number {
    const { indicators } = data;
    if (!indicators) return 0;

    let score = 0;
    let factors = 0;

    // RSI momentum analysis
    if (indicators.rsi !== undefined) {
      if (indicators.rsi < this.rsiOversold) {
        score += 0.3; // Potential reversal upward
      } else if (indicators.rsi > this.rsiOverbought) {
        score -= 0.3; // Potential reversal downward
      } else if (indicators.rsi > 50) {
        score += (indicators.rsi - 50) / 50 * 0.2; // Bullish momentum
      } else {
        score -= (50 - indicators.rsi) / 50 * 0.2; // Bearish momentum
      }
      factors++;
    }

    // MACD momentum analysis
    if (indicators.macd !== undefined) {
      if (indicators.macd > this.macdThreshold) {
        score += 0.4; // Strong bullish momentum
      } else if (indicators.macd < -this.macdThreshold) {
        score -= 0.4; // Strong bearish momentum
      } else {
        score += indicators.macd * 0.2; // Proportional momentum
      }
      factors++;
    }

    // VWAP analysis
    if (indicators.vwap !== undefined) {
      const vwapDeviation = (data.price - indicators.vwap) / indicators.vwap;
      if (Math.abs(vwapDeviation) > this.vwapSensitivity) {
        score += vwapDeviation > 0 ? 0.3 : -0.3;
      } else {
        score += vwapDeviation * 5; // Smaller movements
      }
      factors++;
    }

    // Moving average analysis
    if (indicators.sma20 !== undefined && indicators.sma50 !== undefined) {
      const shortTermTrend = (data.price - indicators.sma20) / indicators.sma20;
      const longTermTrend = (indicators.sma20 - indicators.sma50) / indicators.sma50;
      
      score += shortTermTrend * 0.3;
      score += longTermTrend * 0.2;
      factors++;
    }

    return factors > 0 ? score / factors : 0;
  }

  private getConfirmationSignals(data: MarketData): { 
    bullish: number; 
    bearish: number; 
    strength: number; 
    reasons: string[] 
  } {
    let bullish = 0;
    let bearish = 0;
    const reasons: string[] = [];
    const { indicators } = data;

    if (!indicators) return { bullish: 0, bearish: 0, strength: 1, reasons: [] };

    // Price above/below key moving averages
    if (indicators.sma20 && data.price > indicators.sma20) {
      bullish++;
      reasons.push('Price above SMA20');
    } else if (indicators.sma20 && data.price < indicators.sma20) {
      bearish++;
      reasons.push('Price below SMA20');
    }

    // MACD signal line crossover
    if (indicators.macd !== undefined && indicators.macd > 0) {
      bullish++;
      reasons.push('MACD bullish');
    } else if (indicators.macd !== undefined && indicators.macd < 0) {
      bearish++;
      reasons.push('MACD bearish');
    }

    // Volume momentum
    if (this.hasVolumeConfirmation(data)) {
      if (data.changePercent > 0) {
        bullish++;
        reasons.push('Volume-confirmed uptrend');
      } else {
        bearish++;
        reasons.push('Volume-confirmed downtrend');
      }
    }

    // Bollinger Band position
    if (indicators.bollinger) {
      const { upper, lower } = indicators.bollinger;
      if (data.price > upper) {
        bearish++;
        reasons.push('Above Bollinger upper band');
      } else if (data.price < lower) {
        bullish++;
        reasons.push('Below Bollinger lower band');
      }
    }

    const totalSignals = bullish + bearish;
    const strength = totalSignals > 0 ? Math.max(bullish, bearish) / totalSignals : 1;

    return { bullish, bearish, strength, reasons };
  }

  private hasVolumeConfirmation(data: MarketData): boolean {
    // Simple volume confirmation - in production, this would compare to historical averages
    const avgVolume = 1000000; // Simplified average volume
    return data.volume > avgVolume * 1.5; // 50% above average
  }

  private calculateMomentumPositionSize(confidence: number, momentumScore: number): number {
    const baseSize = this.riskControls.maxPositionSize / 100;
    const momentumMultiplier = 1 + Math.abs(momentumScore) * 0.5;
    return baseSize * confidence * momentumMultiplier;
  }

  private calculateDynamicStopLoss(data: MarketData, action: 'BUY' | 'SELL'): number {
    let stopLoss = this.riskControls.stopLoss;

    // Adjust stop loss based on volatility
    if (data.indicators?.bollinger) {
      const { upper, middle, lower } = data.indicators.bollinger;
      const volatility = (upper - lower) / middle;
      
      // Wider stop loss for more volatile stocks
      stopLoss = Math.max(stopLoss, volatility * 100 * 0.5);
    }

    return Math.min(stopLoss, 15); // Cap at 15%
  }

  private calculateDynamicTakeProfit(data: MarketData, action: 'BUY' | 'SELL', momentumScore: number): number {
    let takeProfit = this.riskControls.takeProfit;

    // Adjust take profit based on momentum strength
    const momentumMultiplier = 1 + Math.abs(momentumScore) * 0.5;
    takeProfit *= momentumMultiplier;

    // Adjust for volatility
    if (data.indicators?.bollinger) {
      const { upper, middle, lower } = data.indicators.bollinger;
      const volatility = (upper - lower) / middle;
      takeProfit *= (1 + volatility);
    }

    return Math.min(takeProfit, 25); // Cap at 25%
  }

  // Method to update momentum parameters
  updateParameters(
    rsiOverbought: number,
    rsiOversold: number,
    macdThreshold: number,
    vwapSensitivity: number
  ): void {
    this.rsiOverbought = Math.max(50, Math.min(90, rsiOverbought));
    this.rsiOversold = Math.max(10, Math.min(50, rsiOversold));
    this.macdThreshold = Math.max(0.1, macdThreshold);
    this.vwapSensitivity = Math.max(0.005, Math.min(0.1, vwapSensitivity));
  }
}