export interface TickData {
  symbol: string;
  price: number;
  volume: number;
  timestamp: number;
  exchange: string;
  bid?: number;
  ask?: number;
  spread?: number;
}

export interface OrderBookData {
  symbol: string;
  bids: [number, number][];
  asks: [number, number][];
  timestamp: number;
  exchange: string;
}

export interface ModelConfig {
  trainingFrequency: 'hourly' | '6hourly' | 'daily' | 'weekly';
  lookbackPeriod: number;
  bufferSize: number;
  minAccuracy: number;
  maxLatency: number;
  enableOnlineLearning: boolean;
  enableRL: boolean;
}

export interface ModelMetrics {
  accuracy: number;
  pnl: number;
  latency: number;
  sharpeRatio: number;
  maxDrawdown: number;
  timestamp: number;
}

export interface TrainingJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: number;
  endTime?: number;
  dataPoints: number;
  metrics?: ModelMetrics;
  modelVersion: string;
}

export interface DriftAlert {
  id: string;
  type: 'accuracy' | 'pnl' | 'latency' | 'distribution';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  resolved: boolean;
}

export interface DataFeed {
  id: string;
  exchange: string;
  status: 'connected' | 'disconnected' | 'error';
  latency: number;
  messageCount: number;
  lastUpdate: number;
}