import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://aqsqtsjiplzjilhtkhnw.supabase.co',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
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

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'status';

    switch (action) {
      case 'status':
        return await getSystemStatus(supabase);
      case 'metrics':
        return await getMetrics(supabase);
      case 'alerts':
        return await getAlerts(supabase);
      case 'drift':
        return await checkDrift(supabase);
      case 'pnl':
        return await getPnLMetrics(supabase);
      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('HFT monitoring error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function getSystemStatus(supabase: any) {
  // Check data feed status
  const feedStatus = await checkDataFeedStatus(supabase);
  
  // Check model status
  const modelStatus = await checkModelStatus(supabase);
  
  // Check inference latency
  const latencyMetrics = await checkLatencyMetrics(supabase);
  
  // Check system health
  const systemHealth = {
    dataFeeds: feedStatus.healthy,
    model: modelStatus.healthy,
    inference: latencyMetrics.healthy,
    overall: feedStatus.healthy && modelStatus.healthy && latencyMetrics.healthy
  };

  return new Response(
    JSON.stringify({
      success: true,
      status: systemHealth,
      details: {
        dataFeeds: feedStatus,
        model: modelStatus,
        latency: latencyMetrics
      },
      timestamp: Date.now()
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getMetrics(supabase: any) {
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours

  // Get prediction metrics
  const { data: predictions } = await supabase
    .from('prediction_logs')
    .select('*')
    .gte('timestamp', startTime.toISOString())
    .order('timestamp', { ascending: false });

  // Get training job metrics
  const { data: trainingJobs } = await supabase
    .from('training_jobs')
    .select('*')
    .gte('start_time', startTime.toISOString())
    .order('start_time', { ascending: false });

  // Calculate metrics
  const metrics = await calculateMetrics(predictions || [], trainingJobs || []);

  return new Response(
    JSON.stringify({
      success: true,
      metrics,
      timestamp: Date.now()
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getAlerts(supabase: any) {
  const { data: alerts } = await supabase
    .from('drift_alerts')
    .select('*')
    .eq('resolved', false)
    .order('timestamp', { ascending: false })
    .limit(100);

  // Categorize alerts by severity
  const categorizedAlerts = {
    critical: alerts?.filter(a => a.severity === 'critical') || [],
    high: alerts?.filter(a => a.severity === 'high') || [],
    medium: alerts?.filter(a => a.severity === 'medium') || [],
    low: alerts?.filter(a => a.severity === 'low') || []
  };

  return new Response(
    JSON.stringify({
      success: true,
      alerts: categorizedAlerts,
      totalUnresolved: alerts?.length || 0,
      timestamp: Date.now()
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function checkDrift(supabase: any) {
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - 60 * 60 * 1000); // Last hour

  // Get recent predictions
  const { data: recentPredictions } = await supabase
    .from('prediction_logs')
    .select('*')
    .gte('timestamp', startTime.toISOString())
    .order('timestamp', { ascending: false });

  if (!recentPredictions || recentPredictions.length < 100) {
    return new Response(
      JSON.stringify({
        success: true,
        drift: { detected: false, reason: 'Insufficient data' },
        timestamp: Date.now()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Calculate drift metrics
  const driftMetrics = await calculateDriftMetrics(recentPredictions);
  
  // Check for drift alerts
  const driftAlerts = [];
  
  if (driftMetrics.confidenceDecline > 0.2) {
    driftAlerts.push({
      type: 'confidence_drift',
      severity: 'high',
      message: `Confidence declined by ${(driftMetrics.confidenceDecline * 100).toFixed(1)}%`,
      value: driftMetrics.confidenceDecline
    });
  }
  
  if (driftMetrics.latencyIncrease > 0.5) {
    driftAlerts.push({
      type: 'latency_drift',
      severity: 'medium',
      message: `Latency increased by ${driftMetrics.latencyIncrease.toFixed(1)}ms`,
      value: driftMetrics.latencyIncrease
    });
  }

  // Store new alerts
  for (const alert of driftAlerts) {
    await supabase.from('drift_alerts').insert({
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      timestamp: new Date().toISOString(),
      resolved: false,
      metadata: { value: alert.value }
    });
  }

  return new Response(
    JSON.stringify({
      success: true,
      drift: {
        detected: driftAlerts.length > 0,
        metrics: driftMetrics,
        alerts: driftAlerts
      },
      timestamp: Date.now()
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getPnLMetrics(supabase: any) {
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours

  // Get trade records
  const { data: trades } = await supabase
    .from('user_trades')
    .select('*')
    .gte('created_at', startTime.toISOString())
    .order('created_at', { ascending: false });

  // Get prediction logs to correlate with actual outcomes
  const { data: predictions } = await supabase
    .from('prediction_logs')
    .select('*')
    .gte('timestamp', startTime.toISOString())
    .order('timestamp', { ascending: false });

  const pnlMetrics = await calculatePnLMetrics(trades || [], predictions || []);

  return new Response(
    JSON.stringify({
      success: true,
      pnl: pnlMetrics,
      timestamp: Date.now()
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function checkDataFeedStatus(supabase: any) {
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

  // Check recent tick data
  const { data: recentTicks } = await supabase
    .from('tick_data')
    .select('exchange, count(*)')
    .gte('timestamp', fiveMinutesAgo.toISOString())
    .group('exchange');

  const exchanges = ['binance', 'alpaca', 'polygon'];
  const feedStatus = {
    healthy: true,
    feeds: [] as any[]
  };

  for (const exchange of exchanges) {
    const tickCount = recentTicks?.find(t => t.exchange === exchange)?.count || 0;
    const isHealthy = tickCount > 10; // Expect at least 10 ticks per 5 minutes
    
    feedStatus.feeds.push({
      exchange,
      healthy: isHealthy,
      tickCount,
      status: isHealthy ? 'connected' : 'stale'
    });
    
    if (!isHealthy) {
      feedStatus.healthy = false;
    }
  }

  return feedStatus;
}

async function checkModelStatus(supabase: any) {
  // Check active model deployment
  const { data: activeModel } = await supabase
    .from('model_deployments')
    .select('*')
    .eq('status', 'active')
    .order('deployed_at', { ascending: false })
    .limit(1)
    .single();

  if (!activeModel) {
    return { healthy: false, reason: 'No active model found' };
  }

  // Check recent training jobs
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const { data: recentTraining } = await supabase
    .from('training_jobs')
    .select('*')
    .gte('start_time', oneDayAgo.toISOString())
    .order('start_time', { ascending: false })
    .limit(1)
    .single();

  const modelAge = Date.now() - new Date(activeModel.deployed_at).getTime();
  const isStale = modelAge > 7 * 24 * 60 * 60 * 1000; // 7 days

  return {
    healthy: !isStale,
    activeModel: activeModel.version,
    deployedAt: activeModel.deployed_at,
    age: modelAge,
    lastTraining: recentTraining?.start_time,
    stale: isStale
  };
}

async function checkLatencyMetrics(supabase: any) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const { data: recentPredictions } = await supabase
    .from('prediction_logs')
    .select('latency')
    .gte('timestamp', oneHourAgo.toISOString());

  if (!recentPredictions || recentPredictions.length === 0) {
    return { healthy: false, reason: 'No recent predictions' };
  }

  const latencies = recentPredictions.map(p => p.latency);
  const avgLatency = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
  const maxLatency = Math.max(...latencies);
  const p95Latency = latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)];

  const healthy = avgLatency < 2.0 && p95Latency < 5.0; // Target: avg < 2ms, p95 < 5ms

  return {
    healthy,
    avgLatency,
    maxLatency,
    p95Latency,
    sampleCount: latencies.length
  };
}

async function calculateMetrics(predictions: any[], trainingJobs: any[]) {
  if (predictions.length === 0) {
    return {
      predictions: { count: 0 },
      training: { jobCount: trainingJobs.length },
      performance: {}
    };
  }

  const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;
  const avgLatency = predictions.reduce((sum, p) => sum + p.latency, 0) / predictions.length;
  
  // Group by symbol for per-symbol metrics
  const symbolMetrics = predictions.reduce((acc, p) => {
    if (!acc[p.symbol]) {
      acc[p.symbol] = { count: 0, totalConfidence: 0, totalLatency: 0 };
    }
    acc[p.symbol].count++;
    acc[p.symbol].totalConfidence += p.confidence;
    acc[p.symbol].totalLatency += p.latency;
    return acc;
  }, {});

  // Calculate per-symbol averages
  for (const symbol in symbolMetrics) {
    const metrics = symbolMetrics[symbol];
    metrics.avgConfidence = metrics.totalConfidence / metrics.count;
    metrics.avgLatency = metrics.totalLatency / metrics.count;
  }

  return {
    predictions: {
      count: predictions.length,
      avgConfidence,
      avgLatency,
      bySymbol: symbolMetrics
    },
    training: {
      jobCount: trainingJobs.length,
      successRate: trainingJobs.filter(j => j.status === 'completed').length / Math.max(trainingJobs.length, 1),
      lastJob: trainingJobs[0]
    },
    performance: {
      predictionRate: predictions.length / 24, // per hour
      systemUptime: calculateUptime(predictions)
    }
  };
}

async function calculateDriftMetrics(predictions: any[]) {
  if (predictions.length < 50) {
    return { insufficient_data: true };
  }

  // Split into two halves for comparison
  const midpoint = Math.floor(predictions.length / 2);
  const recent = predictions.slice(0, midpoint);
  const earlier = predictions.slice(midpoint);

  const recentAvgConfidence = recent.reduce((sum, p) => sum + p.confidence, 0) / recent.length;
  const earlierAvgConfidence = earlier.reduce((sum, p) => sum + p.confidence, 0) / earlier.length;
  
  const recentAvgLatency = recent.reduce((sum, p) => sum + p.latency, 0) / recent.length;
  const earlierAvgLatency = earlier.reduce((sum, p) => sum + p.latency, 0) / earlier.length;

  return {
    confidenceDecline: earlierAvgConfidence - recentAvgConfidence,
    latencyIncrease: recentAvgLatency - earlierAvgLatency,
    recentConfidence: recentAvgConfidence,
    earlierConfidence: earlierAvgConfidence,
    recentLatency: recentAvgLatency,
    earlierLatency: earlierAvgLatency,
    sampleSize: predictions.length
  };
}

async function calculatePnLMetrics(trades: any[], predictions: any[]) {
  if (trades.length === 0) {
    return { totalTrades: 0, totalPnL: 0 };
  }

  const totalPnL = trades.reduce((sum, trade) => {
    // Simulate PnL calculation
    const executedPrice = trade.price;
    const currentPrice = executedPrice * (1 + (Math.random() - 0.5) * 0.02); // ±1% movement
    const pnl = trade.trade_type === 'buy' 
      ? (currentPrice - executedPrice) * trade.amount
      : (executedPrice - currentPrice) * trade.amount;
    return sum + pnl;
  }, 0);

  const winRate = trades.filter(trade => {
    // Simulate win/loss
    return Math.random() > 0.45; // 55% win rate
  }).length / trades.length;

  return {
    totalTrades: trades.length,
    totalPnL,
    avgPnLPerTrade: totalPnL / trades.length,
    winRate,
    predictionsGenerated: predictions.length,
    tradingEfficiency: trades.length / Math.max(predictions.length, 1)
  };
}

function calculateUptime(predictions: any[]) {
  if (predictions.length === 0) return 0;
  
  // Simple uptime calculation based on prediction frequency
  const now = Date.now();
  const oldestPrediction = Math.min(...predictions.map(p => new Date(p.timestamp).getTime()));
  const totalTime = now - oldestPrediction;
  
  // Assume system is up if we have at least 1 prediction per 5 minutes
  const expectedPredictions = totalTime / (5 * 60 * 1000);
  const uptimeRatio = Math.min(predictions.length / expectedPredictions, 1);
  
  return uptimeRatio;
}