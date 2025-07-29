import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://aqsqtsjiplzjilhtkhnw.supabase.co',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface PredictionRequest {
  symbol: string;
  tickData: any[];
  timestamp: number;
}

interface PredictionResult {
  symbol: string;
  prediction: number;
  confidence: number;
  latency: number;
  timestamp: number;
  features: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const startTime = performance.now();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, data } = await req.json();

    switch (action) {
      case 'predict':
        return await handlePrediction(supabase, data, startTime);
      case 'batch_predict':
        return await handleBatchPrediction(supabase, data, startTime);
      case 'stream_predict':
        return await handleStreamPrediction(supabase, data, startTime);
      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('HFT inference error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function handlePrediction(supabase: any, request: PredictionRequest, startTime: number) {
  // Get active model
  const { data: activeModel } = await supabase
    .from('model_deployments')
    .select('*')
    .eq('status', 'active')
    .order('deployed_at', { ascending: false })
    .limit(1)
    .single();

  if (!activeModel) {
    throw new Error('No active model found');
  }

  // Extract features from tick data
  const features = await extractInferenceFeatures(request.tickData);
  
  // Run inference (simulated ONNX model inference)
  const prediction = await runInference(features, activeModel);
  
  const latency = performance.now() - startTime;
  
  // Log prediction for PnL tracking
  await logPrediction(supabase, {
    symbol: request.symbol,
    prediction: prediction.value,
    confidence: prediction.confidence,
    latency,
    timestamp: request.timestamp,
    features,
    model_version: activeModel.version
  });

  // Check for drift detection
  await checkDrift(supabase, features, prediction);

  return new Response(
    JSON.stringify({
      success: true,
      prediction: prediction.value,
      confidence: prediction.confidence,
      latency,
      timestamp: Date.now(),
      modelVersion: activeModel.version
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleBatchPrediction(supabase: any, requests: PredictionRequest[], startTime: number) {
  const results: PredictionResult[] = [];
  
  const { data: activeModel } = await supabase
    .from('model_deployments')
    .select('*')
    .eq('status', 'active')
    .order('deployed_at', { ascending: false })
    .limit(1)
    .single();

  if (!activeModel) {
    throw new Error('No active model found');
  }

  for (const request of requests) {
    const requestStartTime = performance.now();
    const features = await extractInferenceFeatures(request.tickData);
    const prediction = await runInference(features, activeModel);
    const latency = performance.now() - requestStartTime;

    results.push({
      symbol: request.symbol,
      prediction: prediction.value,
      confidence: prediction.confidence,
      latency,
      timestamp: request.timestamp,
      features
    });

    // Log each prediction
    await logPrediction(supabase, {
      symbol: request.symbol,
      prediction: prediction.value,
      confidence: prediction.confidence,
      latency,
      timestamp: request.timestamp,
      features,
      model_version: activeModel.version
    });
  }

  const totalLatency = performance.now() - startTime;

  return new Response(
    JSON.stringify({
      success: true,
      results,
      totalLatency,
      avgLatency: totalLatency / requests.length,
      modelVersion: activeModel.version
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleStreamPrediction(supabase: any, streamData: any, startTime: number) {
  // Handle streaming predictions for real-time tick data
  const predictions = [];
  
  for (const tick of streamData.ticks) {
    const features = await extractStreamFeatures(tick, streamData.buffer);
    const prediction = await runFastInference(features);
    
    predictions.push({
      symbol: tick.symbol,
      prediction: prediction.value,
      confidence: prediction.confidence,
      timestamp: tick.timestamp
    });
  }

  // Update streaming buffer
  await updateStreamBuffer(supabase, streamData);

  return new Response(
    JSON.stringify({
      success: true,
      predictions,
      latency: performance.now() - startTime,
      bufferSize: streamData.buffer.length
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function extractInferenceFeatures(tickData: any[]) {
  if (tickData.length < 10) {
    throw new Error('Insufficient data for feature extraction');
  }

  const latest = tickData[tickData.length - 1];
  const window = tickData.slice(-10);
  
  // Calculate technical indicators
  const sma_5 = window.slice(-5).reduce((sum, tick) => sum + tick.price, 0) / 5;
  const sma_10 = window.reduce((sum, tick) => sum + tick.price, 0) / 10;
  
  const returns = window.slice(1).map((tick, i) => 
    (tick.price - window[i].price) / window[i].price
  );
  
  const volatility = Math.sqrt(returns.reduce((sum, ret) => sum + ret * ret, 0) / returns.length);
  
  return {
    price: latest.price,
    volume: latest.volume,
    spread: latest.spread || 0,
    sma_5,
    sma_10,
    price_sma_ratio: latest.price / sma_10,
    volatility,
    volume_sma: window.reduce((sum, tick) => sum + tick.volume, 0) / window.length,
    momentum: (latest.price - window[0].price) / window[0].price,
    bid_ask_spread: latest.ask - latest.bid,
    timestamp: latest.timestamp
  };
}

async function extractStreamFeatures(tick: any, buffer: any[]) {
  // Fast feature extraction for streaming data
  if (buffer.length < 5) {
    return {
      price: tick.price,
      volume: tick.volume,
      spread: tick.spread || 0,
      momentum: 0,
      volatility: 0
    };
  }

  const recentTicks = buffer.slice(-5);
  const momentum = (tick.price - recentTicks[0].price) / recentTicks[0].price;
  
  return {
    price: tick.price,
    volume: tick.volume,
    spread: tick.spread || 0,
    momentum,
    volatility: calculateVolatility(recentTicks),
    volume_ratio: tick.volume / (recentTicks.reduce((sum, t) => sum + t.volume, 0) / recentTicks.length)
  };
}

async function runInference(features: any, model: any) {
  // Simulated ONNX model inference with sub-2ms latency
  const startTime = performance.now();
  
  // Feature normalization (simulated)
  const normalizedFeatures = normalizeFeatures(features);
  
  // Model prediction (simulated neural network forward pass)
  const prediction = await simulateNeuralNetworkInference(normalizedFeatures);
  
  const inferenceTime = performance.now() - startTime;
  
  if (inferenceTime > 2.0) {
    console.warn(`Inference latency exceeded 2ms: ${inferenceTime}ms`);
  }
  
  return {
    value: prediction,
    confidence: Math.min(Math.abs(prediction) + 0.1, 0.95),
    inferenceTime
  };
}

async function runFastInference(features: any) {
  // Ultra-fast inference for streaming predictions
  const prediction = features.momentum * 0.6 + 
                    (features.volume_ratio - 1) * 0.2 + 
                    Math.random() * 0.1 - 0.05;
  
  return {
    value: Math.tanh(prediction), // Normalize to [-1, 1]
    confidence: Math.min(Math.abs(prediction) + 0.1, 0.9)
  };
}

function normalizeFeatures(features: any) {
  // Feature normalization for model input
  return {
    price_norm: (features.price - 100) / 1000,
    volume_norm: Math.log(features.volume + 1) / 20,
    spread_norm: features.spread / features.price,
    momentum_norm: Math.tanh(features.momentum * 100),
    volatility_norm: Math.min(features.volatility * 100, 1)
  };
}

async function simulateNeuralNetworkInference(features: any) {
  // Simulated neural network computation
  const weights = [0.3, -0.2, 0.5, 0.1, -0.4];
  const inputs = Object.values(features);
  
  let output = 0;
  for (let i = 0; i < Math.min(inputs.length, weights.length); i++) {
    output += (inputs[i] as number) * weights[i];
  }
  
  return Math.tanh(output); // Activation function
}

async function logPrediction(supabase: any, predictionData: any) {
  await supabase.from('prediction_logs').insert({
    symbol: predictionData.symbol,
    prediction: predictionData.prediction,
    confidence: predictionData.confidence,
    latency: predictionData.latency,
    timestamp: new Date(predictionData.timestamp).toISOString(),
    features: predictionData.features,
    model_version: predictionData.model_version
  });
}

async function checkDrift(supabase: any, features: any, prediction: any) {
  // Simple drift detection based on prediction confidence
  if (prediction.confidence < 0.3) {
    await supabase.from('drift_alerts').insert({
      type: 'confidence',
      severity: 'medium',
      message: `Low prediction confidence: ${prediction.confidence}`,
      timestamp: new Date().toISOString(),
      features: features
    });
  }
  
  // Check if features are within expected ranges
  if (features.volatility > 0.05) {
    await supabase.from('drift_alerts').insert({
      type: 'volatility',
      severity: 'high',
      message: `High volatility detected: ${features.volatility}`,
      timestamp: new Date().toISOString(),
      features: features
    });
  }
}

async function updateStreamBuffer(supabase: any, streamData: any) {
  // Store streaming buffer state for persistence
  await supabase.from('stream_buffers').upsert({
    id: 'main_buffer',
    buffer_data: streamData.buffer.slice(-1000), // Keep last 1000 ticks
    updated_at: new Date().toISOString()
  });
}

function calculateVolatility(ticks: any[]) {
  if (ticks.length < 2) return 0;
  
  const returns = ticks.slice(1).map((tick, i) => 
    (tick.price - ticks[i].price) / ticks[i].price
  );
  
  const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
  
  return Math.sqrt(variance);
}