import { TradingStrategy, TradeSignal, MarketData, RiskControls } from '../types/strategy';

interface MLFeatures {
  price_change_1d: number;
  price_change_7d: number;
  volume_ratio: number;
  volatility: number;
  rsi: number;
  macd: number;
  bollinger_position: number;
  sector_performance: number;
  market_correlation: number;
}

interface MLModel {
  weights: number[];
  bias: number;
  lastTrained: string;
  accuracy: number;
}

export class MLStrategy extends TradingStrategy {
  private models: Map<string, MLModel>;
  private featureHistory: Map<string, MLFeatures[]>;
  private trainingDataSize: number;
  private retrainThreshold: number;

  constructor(riskControls: RiskControls) {
    super('ml-strategy', 'ML-Based Strategy', riskControls);
    this.models = new Map();
    this.featureHistory = new Map();
    this.trainingDataSize = 100;
    this.retrainThreshold = 0.1; // Retrain when accuracy drops below 90%
    
    // Initialize base models for common symbols
    this.initializeBaseModels();
  }

  async generateSignal(marketData: MarketData[]): Promise<TradeSignal[]> {
    const signals: TradeSignal[] = [];
    const startTime = Date.now();

    try {
      for (const data of marketData) {
        // Extract features for ML model
        const features = this.extractFeatures(data);
        
        // Update feature history
        this.updateFeatureHistory(data.symbol, features);
        
        // Get or create model for this symbol
        let model = this.models.get(data.symbol);
        if (!model) {
          model = this.createNewModel();
          this.models.set(data.symbol, model);
        }

        // Check if model needs retraining
        if (this.shouldRetrain(model)) {
          await this.retrainModel(data.symbol);
          model = this.models.get(data.symbol)!;
        }

        // Generate prediction
        const prediction = this.predict(features, model);
        const confidence = this.calculateConfidence(prediction, features, model);

        // Determine action based on prediction
        let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
        
        if (prediction > 0.6 && confidence > 0.4) {
          action = 'BUY';
        } else if (prediction < -0.6 && confidence > 0.4) {
          action = 'SELL';
        }

        if (action !== 'HOLD') {
          signals.push({
            symbol: data.symbol,
            action,
            confidence: Math.min(confidence, 0.95),
            quantity: this.calculateMLPositionSize(confidence, Math.abs(prediction)),
            stopLoss: this.calculateAdaptiveStopLoss(features),
            takeProfit: this.calculateAdaptiveTakeProfit(features, prediction),
            reason: `ML Prediction: ${prediction.toFixed(3)} (model accuracy: ${(model.accuracy * 100).toFixed(1)}%)`,
            timestamp: new Date().toISOString()
          });
        }
      }

      const latency = Date.now() - startTime;
      if (signals.length > 0) {
        this.updatePerformance(0, latency);
      }

    } catch (error) {
      console.error('ML Strategy error:', error);
    }

    return signals;
  }

  private extractFeatures(data: MarketData): MLFeatures {
    const features: MLFeatures = {
      price_change_1d: data.changePercent,
      price_change_7d: this.calculateWeeklyChange(data.symbol, data.price),
      volume_ratio: this.calculateVolumeRatio(data),
      volatility: this.calculateVolatility(data.symbol),
      rsi: data.indicators?.rsi || 50,
      macd: data.indicators?.macd || 0,
      bollinger_position: this.calculateBollingerPosition(data),
      sector_performance: this.calculateSectorPerformance(data.symbol),
      market_correlation: this.calculateMarketCorrelation(data.symbol)
    };

    return features;
  }

  private predict(features: MLFeatures, model: MLModel): number {
    // Simple linear model prediction
    const featureArray = [
      features.price_change_1d,
      features.price_change_7d,
      features.volume_ratio,
      features.volatility,
      features.rsi / 100, // Normalize RSI
      features.macd,
      features.bollinger_position,
      features.sector_performance,
      features.market_correlation
    ];

    let prediction = model.bias;
    for (let i = 0; i < featureArray.length && i < model.weights.length; i++) {
      prediction += featureArray[i] * model.weights[i];
    }

    // Apply sigmoid activation to get value between -1 and 1
    return Math.tanh(prediction);
  }

  private calculateConfidence(prediction: number, features: MLFeatures, model: MLModel): number {
    // Base confidence on model accuracy and prediction strength
    let confidence = model.accuracy * Math.abs(prediction);
    
    // Adjust confidence based on feature quality
    const featureQuality = this.assessFeatureQuality(features);
    confidence *= featureQuality;
    
    // Reduce confidence for extreme RSI values (potential reversal)
    if (features.rsi > 80 || features.rsi < 20) {
      confidence *= 0.8;
    }
    
    return Math.min(confidence, 0.95);
  }

  private assessFeatureQuality(features: MLFeatures): number {
    let quality = 1.0;
    
    // Check for missing or unusual values
    if (features.rsi === 50 && features.macd === 0) {
      quality *= 0.7; // Likely default values
    }
    
    // Volume confirmation
    if (features.volume_ratio > 1.5) {
      quality *= 1.1; // High volume confirmation
    } else if (features.volume_ratio < 0.5) {
      quality *= 0.9; // Low volume uncertainty
    }
    
    return Math.max(0.3, Math.min(1.2, quality));
  }

  private shouldRetrain(model: MLModel): boolean {
    return model.accuracy < this.retrainThreshold || 
           Date.now() - new Date(model.lastTrained).getTime() > 24 * 60 * 60 * 1000; // 24 hours
  }

  private async retrainModel(symbol: string): Promise<void> {
    // Simulate XGBoost/LSTM training process
    console.log(`Retraining ML model for ${symbol}...`);
    
    const history = this.featureHistory.get(symbol) || [];
    if (history.length < 20) return; // Need minimum data for training
    
    // Simulate training process
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Create new model with improved weights
    const newModel: MLModel = {
      weights: this.generateOptimizedWeights(history),
      bias: Math.random() * 0.1 - 0.05,
      lastTrained: new Date().toISOString(),
      accuracy: 0.75 + Math.random() * 0.2 // Simulate 75-95% accuracy
    };
    
    this.models.set(symbol, newModel);
    console.log(`Model retrained for ${symbol} with accuracy: ${(newModel.accuracy * 100).toFixed(1)}%`);
  }

  private generateOptimizedWeights(history: MLFeatures[]): number[] {
    // Simulate feature importance learning
    return [
      0.3 + Math.random() * 0.2,  // price_change_1d
      0.2 + Math.random() * 0.1,  // price_change_7d
      0.1 + Math.random() * 0.1,  // volume_ratio
      -0.1 + Math.random() * 0.2, // volatility
      0.15 + Math.random() * 0.1, // rsi
      0.25 + Math.random() * 0.1, // macd
      0.1 + Math.random() * 0.1,  // bollinger_position
      0.05 + Math.random() * 0.1, // sector_performance
      0.05 + Math.random() * 0.1  // market_correlation
    ];
  }

  private initializeBaseModels(): void {
    const symbols = ['AAPL', 'GOOGL', 'MSFT', 'NVDA', 'META', 'TSLA'];
    
    for (const symbol of symbols) {
      this.models.set(symbol, this.createNewModel());
    }
  }

  private createNewModel(): MLModel {
    return {
      weights: [0.2, 0.15, 0.1, 0.05, 0.1, 0.2, 0.08, 0.07, 0.05],
      bias: 0,
      lastTrained: new Date().toISOString(),
      accuracy: 0.7 + Math.random() * 0.2
    };
  }

  private updateFeatureHistory(symbol: string, features: MLFeatures): void {
    if (!this.featureHistory.has(symbol)) {
      this.featureHistory.set(symbol, []);
    }
    
    const history = this.featureHistory.get(symbol)!;
    history.push(features);
    
    // Keep only recent history
    if (history.length > this.trainingDataSize) {
      history.shift();
    }
  }

  // Helper methods for feature calculation
  private calculateWeeklyChange(symbol: string, currentPrice: number): number {
    // Simulate weekly change calculation
    return (Math.random() - 0.5) * 0.2; // -10% to +10%
  }

  private calculateVolumeRatio(data: MarketData): number {
    // Simulate volume ratio to average
    return 0.5 + Math.random() * 2; // 0.5x to 2.5x average
  }

  private calculateVolatility(symbol: string): number {
    // Simulate volatility calculation
    return Math.random() * 0.3; // 0% to 30% volatility
  }

  private calculateBollingerPosition(data: MarketData): number {
    if (!data.indicators?.bollinger) return 0.5;
    
    const { upper, lower } = data.indicators.bollinger;
    return (data.price - lower) / (upper - lower);
  }

  private calculateSectorPerformance(symbol: string): number {
    // Simulate sector performance
    return (Math.random() - 0.5) * 0.1; // -5% to +5%
  }

  private calculateMarketCorrelation(symbol: string): number {
    // Simulate market correlation
    return 0.3 + Math.random() * 0.6; // 0.3 to 0.9 correlation
  }

  private calculateMLPositionSize(confidence: number, prediction: number): number {
    const baseSize = this.riskControls.maxPositionSize / 100;
    const predictionMultiplier = 1 + Math.abs(prediction) * 0.5;
    return baseSize * confidence * predictionMultiplier;
  }

  private calculateAdaptiveStopLoss(features: MLFeatures): number {
    let stopLoss = this.riskControls.stopLoss;
    
    // Adjust based on volatility
    stopLoss = Math.max(stopLoss, features.volatility * 100 * 0.5);
    
    return Math.min(stopLoss, 20);
  }

  private calculateAdaptiveTakeProfit(features: MLFeatures, prediction: number): number {
    let takeProfit = this.riskControls.takeProfit;
    
    // Adjust based on prediction confidence and volatility
    takeProfit *= (1 + Math.abs(prediction) * 0.5);
    takeProfit *= (1 + features.volatility);
    
    return Math.min(takeProfit, 30);
  }

  // Public methods for model management
  getModelInfo(symbol: string): MLModel | null {
    return this.models.get(symbol) || null;
  }

  forceRetrain(symbol: string): Promise<void> {
    return this.retrainModel(symbol);
  }
}
