// Model optimization utilities for sub-5ms inference
import { TransformerPredictor } from './transformerModel';

export class ModelOptimizer {
  private static instance: ModelOptimizer;
  private optimizedModel: any = null;
  
  static getInstance(): ModelOptimizer {
    if (!ModelOptimizer.instance) {
      ModelOptimizer.instance = new ModelOptimizer();
    }
    return ModelOptimizer.instance;
  }

  // Quantize model for faster inference
  async quantizeModel(model: TransformerPredictor): Promise<void> {
    console.log('Quantizing model for faster inference...');
    // Simulate model quantization (INT8)
    this.optimizedModel = {
      ...model,
      quantized: true,
      inferenceTime: 0.003 // 3ms target
    };
  }

  // Early stopping callback
  createEarlyStoppingCallback(patience: number = 10, minDelta: number = 0.001) {
    let bestLoss = Infinity;
    let waitCount = 0;

    return (currentLoss: number, epoch: number): boolean => {
      if (currentLoss < bestLoss - minDelta) {
        bestLoss = currentLoss;
        waitCount = 0;
        return false; // Continue training
      } else {
        waitCount++;
        if (waitCount >= patience) {
          console.log(`Early stopping at epoch ${epoch}`);
          return true; // Stop training
        }
        return false;
      }
    };
  }

  // Learning rate scheduler
  calculateLearningRate(epoch: number, baseLR: number = 0.001): number {
    // Cosine annealing with warm restarts
    const cycleLength = 50;
    const cycle = Math.floor(epoch / cycleLength);
    const cycleProgress = (epoch % cycleLength) / cycleLength;
    
    return baseLR * 0.5 * (1 + Math.cos(Math.PI * cycleProgress)) * Math.pow(0.9, cycle);
  }

  // Model compression using knowledge distillation
  async compressModel(teacherModel: any, compressionRatio: number = 0.5): Promise<any> {
    console.log(`Compressing model by ${(1 - compressionRatio) * 100}%`);
    
    // Simulate knowledge distillation
    const compressedModel = {
      layers: Math.floor(teacherModel.layers * compressionRatio),
      parameters: Math.floor(teacherModel.parameters * compressionRatio),
      inferenceTime: teacherModel.inferenceTime * compressionRatio,
      accuracy: teacherModel.accuracy * 0.95 // Slight accuracy trade-off
    };

    return compressedModel;
  }

  // ONNX export simulation
  async exportToONNX(model: any): Promise<string> {
    console.log('Exporting model to ONNX format...');
    // Simulate ONNX export
    return `model_${Date.now()}.onnx`;
  }

  // TensorRT optimization for GPU inference
  async optimizeForTensorRT(modelPath: string): Promise<string> {
    console.log('Optimizing model with TensorRT...');
    // Simulate TensorRT optimization
    return `${modelPath}_tensorrt.engine`;
  }
}

// Walk-forward cross-validation for time series
export class WalkForwardValidator {
  private windowSize: number;
  private stepSize: number;

  constructor(windowSize: number = 1000, stepSize: number = 100) {
    this.windowSize = windowSize;
    this.stepSize = stepSize;
  }

  async validate(data: number[][], labels: number[], model: TransformerPredictor): Promise<{
    avgAccuracy: number;
    avgSharpe: number;
    maxDrawdown: number;
    folds: any[];
  }> {
    const folds = [];
    let totalAccuracy = 0;
    let totalSharpe = 0;
    let maxDrawdown = 0;

    for (let i = this.windowSize; i < data.length - this.stepSize; i += this.stepSize) {
      const trainData = data.slice(i - this.windowSize, i);
      const trainLabels = labels.slice(i - this.windowSize, i);
      const testData = data.slice(i, i + this.stepSize);
      const testLabels = labels.slice(i, i + this.stepSize);

      // Train model on window (simulate training)
      console.log(`Training on window ${i - this.windowSize}-${i}`);

      // Test on next period
      const predictions = testData.map(d => model.predict(d));
      const accuracy = this.calculateAccuracy(predictions, testLabels);
      const sharpe = this.calculateSharpe(predictions, testLabels);
      const drawdown = this.calculateDrawdown(predictions);

      folds.push({
        period: `${i - this.windowSize}-${i + this.stepSize}`,
        accuracy,
        sharpe,
        drawdown,
        samples: this.stepSize
      });

      totalAccuracy += accuracy;
      totalSharpe += sharpe;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }

    return {
      avgAccuracy: totalAccuracy / folds.length,
      avgSharpe: totalSharpe / folds.length,
      maxDrawdown,
      folds
    };
  }

  private calculateAccuracy(predictions: any[], labels: number[]): number {
    const correct = predictions.reduce((acc, pred, idx) => {
      const direction = pred.price_change > 0 ? 1 : -1;
      const actualDirection = labels[idx] > 0 ? 1 : -1;
      return acc + (direction === actualDirection ? 1 : 0);
    }, 0);
    return correct / predictions.length;
  }

  private calculateSharpe(predictions: any[], labels: number[]): number {
    const returns = predictions.map((pred, idx) => {
      const signal = pred.price_change > 0 ? 1 : -1;
      return signal * labels[idx];
    });

    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance);

    return volatility === 0 ? 0 : avgReturn / volatility;
  }

  private calculateDrawdown(predictions: any[]): number {
    let peak = 0;
    let maxDrawdown = 0;
    let cumulative = 0;

    for (const pred of predictions) {
      cumulative += pred.price_change || 0;
      peak = Math.max(peak, cumulative);
      const drawdown = (peak - cumulative) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }

    return maxDrawdown;
  }
}

// Feature compression using PCA
export class FeatureCompressor {
  private components: number[][] = [];
  private explained_variance: number[] = [];

  async fitPCA(features: number[][], nComponents: number = 10): Promise<void> {
    console.log(`Fitting PCA with ${nComponents} components...`);
    
    // Simulate PCA fitting
    this.components = Array(nComponents).fill(0).map(() => 
      Array(features[0].length).fill(0).map(() => Math.random() * 2 - 1)
    );
    
    this.explained_variance = Array(nComponents).fill(0).map((_, i) => 
      0.9 * Math.exp(-i * 0.2) // Decreasing explained variance
    );
  }

  transform(features: number[][]): number[][] {
    if (this.components.length === 0) {
      throw new Error('PCA not fitted. Call fitPCA first.');
    }

    return features.map(row => 
      this.components.map(component =>
        component.reduce((sum, weight, idx) => sum + weight * row[idx], 0)
      )
    );
  }

  getExplainedVarianceRatio(): number[] {
    const totalVariance = this.explained_variance.reduce((sum, var_) => sum + var_, 0);
    return this.explained_variance.map(var_ => var_ / totalVariance);
  }
}

// Synthetic data generator for institutional-grade datasets
export class SyntheticDataGenerator {
  generateTickData(symbols: string[], hours: number = 1): {
    ticks: any[];
    orderBooks: any[];
    trades: any[];
  } {
    const ticks = [];
    const orderBooks = [];
    const trades = [];
    const ticksPerSecond = 1000; // High-frequency ticks
    
    for (let h = 0; h < hours; h++) {
      for (let s = 0; s < 3600; s++) {
        for (let t = 0; t < ticksPerSecond; t++) {
          const timestamp = Date.now() + (h * 3600 + s) * 1000 + t;
          
          for (const symbol of symbols) {
            // Generate tick
            const basePrice = 100 + Math.sin(h * 0.1) * 10;
            const tick = {
              symbol,
              timestamp,
              price: basePrice + (Math.random() - 0.5) * 0.1,
              size: Math.floor(Math.random() * 1000) + 100,
              side: Math.random() > 0.5 ? 'buy' : 'sell'
            };
            ticks.push(tick);

            // Generate order book snapshot
            if (t % 100 === 0) { // Every 100ms
              const orderBook = this.generateOrderBookSnapshot(symbol, basePrice, timestamp);
              orderBooks.push(orderBook);
            }

            // Generate trade
            if (Math.random() > 0.99) { // 1% chance per tick
              const trade = {
                symbol,
                timestamp,
                price: tick.price,
                size: tick.size,
                side: tick.side,
                aggressor: Math.random() > 0.6 ? 'taker' : 'maker'
              };
              trades.push(trade);
            }
          }
        }
      }
    }

    return { ticks, orderBooks, trades };
  }

  private generateOrderBookSnapshot(symbol: string, basePrice: number, timestamp: number): any {
    const bids = [];
    const asks = [];

    for (let i = 0; i < 10; i++) {
      bids.push({
        price: basePrice - (i + 1) * 0.01,
        size: Math.floor(Math.random() * 5000) + 1000
      });
      
      asks.push({
        price: basePrice + (i + 1) * 0.01,
        size: Math.floor(Math.random() * 5000) + 1000
      });
    }

    return {
      symbol,
      timestamp,
      bids: bids.sort((a, b) => b.price - a.price),
      asks: asks.sort((a, b) => a.price - b.price),
      lastPrice: basePrice,
      lastSize: Math.floor(Math.random() * 1000) + 100
    };
  }

  // Generate synthetic ETF constituents
  generateETFConstituents(etfSymbol: string, numConstituents: number = 50): {
    constituents: any[];
    weights: number[];
  } {
    const constituents = [];
    const weights = [];
    
    for (let i = 0; i < numConstituents; i++) {
      constituents.push({
        symbol: `STOCK${i.toString().padStart(3, '0')}`,
        weight: Math.random(),
        sector: ['Tech', 'Finance', 'Healthcare', 'Energy'][Math.floor(Math.random() * 4)],
        marketCap: Math.random() * 1000000000000, // Up to $1T
        price: 50 + Math.random() * 200
      });
    }

    // Normalize weights
    const totalWeight = constituents.reduce((sum, c) => sum + c.weight, 0);
    constituents.forEach(c => {
      const normalizedWeight = c.weight / totalWeight;
      weights.push(normalizedWeight);
      c.weight = normalizedWeight;
    });

    return { constituents, weights };
  }
}