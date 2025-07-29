import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://aqsqtsjiplzjilhtkhnw.supabase.co',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ModelConfig {
  trainingFrequency: 'hourly' | '6hourly' | 'daily' | 'weekly';
  lookbackPeriod: number;
  bufferSize: number;
  minAccuracy: number;
  maxLatency: number;
  enableOnlineLearning: boolean;
  enableRL: boolean;
}

interface TrainingJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: number;
  endTime?: number;
  dataPoints: number;
  metrics?: any;
  modelVersion: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, config, symbols } = await req.json();
    console.log(`Starting model training action: ${action}`);

    switch (action) {
      case 'train':
        return await handleTraining(supabase, config, symbols);
      case 'validate':
        return await handleValidation(supabase, config, symbols);
      case 'deploy':
        return await handleDeployment(supabase, config);
      case 'rollback':
        return await handleRollback(supabase);
      case 'online_learning':
        return await handleOnlineLearning(supabase, config, symbols);
      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('HFT model training error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function handleTraining(supabase: any, config: ModelConfig, symbols: string[]) {
  const jobId = crypto.randomUUID();
  const startTime = Date.now();
  
  // Create training job record
  await supabase.from('training_jobs').insert({
    id: jobId,
    status: 'running',
    start_time: new Date(startTime).toISOString(),
    config: config,
    symbols: symbols
  });

  try {
    // Fetch training data based on lookback period
    const endTime = new Date();
    const startDate = new Date(endTime.getTime() - config.lookbackPeriod * 24 * 60 * 60 * 1000);
    
    const { data: tickData, error: tickError } = await supabase
      .from('tick_data')
      .select('*')
      .in('symbol', symbols)
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endTime.toISOString())
      .order('timestamp', { ascending: true });

    if (tickError) throw tickError;

    console.log(`Fetched ${tickData?.length || 0} tick records for training`);

    // Feature engineering
    const features = await extractFeatures(tickData || []);
    const labels = await generateLabels(tickData || []);

    // Model training with cross-validation
    const modelMetrics = await trainModel(features, labels, config);

    // Validate performance using rolling window
    const validationResults = await rollingWindowValidation(features, labels, config);

    // Update training job with results
    await supabase.from('training_jobs').update({
      status: 'completed',
      end_time: new Date().toISOString(),
      data_points: tickData?.length || 0,
      metrics: modelMetrics,
      validation_results: validationResults
    }).eq('id', jobId);

    // Deploy model if performance meets criteria
    if (modelMetrics.accuracy >= config.minAccuracy) {
      await deployModel(supabase, jobId, modelMetrics);
    }

    return new Response(
      JSON.stringify({
        success: true,
        jobId,
        metrics: modelMetrics,
        validationResults,
        deployed: modelMetrics.accuracy >= config.minAccuracy
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    // Update job status to failed
    await supabase.from('training_jobs').update({
      status: 'failed',
      end_time: new Date().toISOString(),
      error_message: error.message
    }).eq('id', jobId);

    throw error;
  }
}

async function handleValidation(supabase: any, config: ModelConfig, symbols: string[]) {
  // Fetch last 5 days of data for backtesting
  const endTime = new Date();
  const startDate = new Date(endTime.getTime() - 5 * 24 * 60 * 60 * 1000);
  
  const { data: tickData } = await supabase
    .from('tick_data')
    .select('*')
    .in('symbol', symbols)
    .gte('timestamp', startDate.toISOString())
    .lte('timestamp', endTime.toISOString())
    .order('timestamp', { ascending: true });

  const backtestResults = await runBacktest(tickData || [], config);

  return new Response(
    JSON.stringify({
      success: true,
      backtestResults,
      timestamp: Date.now()
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleDeployment(supabase: any, config: ModelConfig) {
  const modelVersion = `v${Date.now()}`;
  
  // Store model deployment record
  await supabase.from('model_deployments').insert({
    version: modelVersion,
    config: config,
    deployed_at: new Date().toISOString(),
    status: 'active'
  });

  // Export model to ONNX format (simulated)
  const onnxModel = await exportToONNX(config);
  
  // Deploy to inference server (simulated)
  await deployToInferenceServer(onnxModel, modelVersion);

  return new Response(
    JSON.stringify({
      success: true,
      modelVersion,
      deployedAt: Date.now()
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleRollback(supabase: any) {
  // Get previous model version
  const { data: deployments } = await supabase
    .from('model_deployments')
    .select('*')
    .eq('status', 'active')
    .order('deployed_at', { ascending: false })
    .limit(2);

  if (!deployments || deployments.length < 2) {
    throw new Error('No previous model version available for rollback');
  }

  const currentModel = deployments[0];
  const previousModel = deployments[1];

  // Deactivate current model
  await supabase.from('model_deployments')
    .update({ status: 'inactive' })
    .eq('version', currentModel.version);

  // Activate previous model
  await supabase.from('model_deployments')
    .update({ status: 'active' })
    .eq('version', previousModel.version);

  return new Response(
    JSON.stringify({
      success: true,
      rolledBackTo: previousModel.version,
      timestamp: Date.now()
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleOnlineLearning(supabase: any, config: ModelConfig, symbols: string[]) {
  // Get latest tick data for online learning
  const { data: recentTicks } = await supabase
    .from('tick_data')
    .select('*')
    .in('symbol', symbols)
    .order('timestamp', { ascending: false })
    .limit(config.bufferSize);

  if (!recentTicks || recentTicks.length === 0) {
    return new Response(
      JSON.stringify({ success: true, message: 'No new data for online learning' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Extract features from recent data
  const features = await extractFeatures(recentTicks);
  const labels = await generateLabels(recentTicks);

  // Perform mini-batch update
  const updateResults = await performMiniBatchUpdate(features, labels, config);

  // Store online learning metrics
  await supabase.from('online_learning_logs').insert({
    timestamp: new Date().toISOString(),
    data_points: recentTicks.length,
    update_metrics: updateResults,
    symbols: symbols
  });

  return new Response(
    JSON.stringify({
      success: true,
      updateResults,
      dataPoints: recentTicks.length,
      timestamp: Date.now()
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function extractFeatures(tickData: any[]) {
  // Feature engineering: technical indicators, price movements, volume patterns
  const features = [];
  
  for (let i = 10; i < tickData.length; i++) {
    const window = tickData.slice(i - 10, i);
    const current = tickData[i];
    
    features.push({
      price_sma_10: window.reduce((sum, tick) => sum + tick.price, 0) / window.length,
      price_change: (current.price - tickData[i - 1].price) / tickData[i - 1].price,
      volume_ratio: current.volume / (window.reduce((sum, tick) => sum + tick.volume, 0) / window.length),
      spread_ratio: current.spread / current.price,
      bid_ask_imbalance: (current.ask - current.bid) / (current.ask + current.bid),
      price_volatility: Math.sqrt(window.reduce((sum, tick, idx) => {
        if (idx === 0) return 0;
        const ret = (tick.price - window[idx - 1].price) / window[idx - 1].price;
        return sum + ret * ret;
      }, 0) / (window.length - 1))
    });
  }
  
  return features;
}

async function generateLabels(tickData: any[]) {
  // Generate labels based on future price movements
  const labels = [];
  
  for (let i = 0; i < tickData.length - 5; i++) {
    const current = tickData[i];
    const future = tickData[i + 5];
    const priceChange = (future.price - current.price) / current.price;
    
    // Binary classification: 1 for price increase > 0.1%, 0 otherwise
    labels.push(priceChange > 0.001 ? 1 : 0);
  }
  
  return labels;
}

async function trainModel(features: any[], labels: number[], config: ModelConfig) {
  // Simulated model training with metrics
  const accuracy = 0.65 + Math.random() * 0.15; // 65-80% accuracy
  const latency = 0.5 + Math.random() * 1.5; // 0.5-2ms latency
  
  return {
    accuracy,
    latency,
    sharpeRatio: 1.2 + Math.random() * 0.8,
    maxDrawdown: 0.05 + Math.random() * 0.1,
    trainingTime: Date.now(),
    dataPoints: features.length
  };
}

async function rollingWindowValidation(features: any[], labels: number[], config: ModelConfig) {
  // Simulate rolling window cross-validation
  const windowSize = Math.floor(features.length * 0.2);
  const results = [];
  
  for (let i = 0; i < 5; i++) {
    const startIdx = i * windowSize;
    const endIdx = Math.min(startIdx + windowSize, features.length);
    
    results.push({
      window: i + 1,
      accuracy: 0.60 + Math.random() * 0.20,
      sharpeRatio: 1.0 + Math.random() * 1.0,
      maxDrawdown: 0.03 + Math.random() * 0.07
    });
  }
  
  return results;
}

async function runBacktest(tickData: any[], config: ModelConfig) {
  // Simulated backtesting results
  return {
    totalTrades: Math.floor(Math.random() * 1000) + 500,
    winRate: 0.55 + Math.random() * 0.15,
    totalReturn: (Math.random() - 0.5) * 0.1,
    sharpeRatio: 1.0 + Math.random() * 1.5,
    maxDrawdown: 0.02 + Math.random() * 0.08,
    avgLatency: 0.8 + Math.random() * 1.2
  };
}

async function deployModel(supabase: any, jobId: string, metrics: any) {
  const modelVersion = `v${Date.now()}`;
  
  await supabase.from('model_deployments').insert({
    job_id: jobId,
    version: modelVersion,
    metrics: metrics,
    deployed_at: new Date().toISOString(),
    status: 'active'
  });
}

async function exportToONNX(config: ModelConfig) {
  // Simulated ONNX export
  return {
    format: 'onnx',
    version: '1.0',
    optimized: true,
    size: '2.4MB',
    exportTime: Date.now()
  };
}

async function deployToInferenceServer(onnxModel: any, version: string) {
  // Simulated deployment to inference server
  console.log(`Deploying model ${version} to inference server`);
  return { deployed: true, endpoint: `inference-${version}` };
}

async function performMiniBatchUpdate(features: any[], labels: number[], config: ModelConfig) {
  // Simulated mini-batch gradient update
  return {
    learningRate: 0.001,
    batchSize: Math.min(features.length, 64),
    weightUpdates: features.length,
    convergence: Math.random() > 0.1
  };
}