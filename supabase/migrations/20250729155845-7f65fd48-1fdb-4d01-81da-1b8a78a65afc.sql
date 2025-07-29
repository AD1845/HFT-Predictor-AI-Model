-- Create tables for HFT system

-- Tick data table for real-time market data
CREATE TABLE public.tick_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  price NUMERIC NOT NULL,
  volume BIGINT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  exchange TEXT NOT NULL,
  bid NUMERIC,
  ask NUMERIC,
  spread NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Order book data table
CREATE TABLE public.order_book_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  bids JSONB NOT NULL,
  asks JSONB NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  exchange TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Training jobs table
CREATE TABLE public.training_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'pending',
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  data_points INTEGER,
  metrics JSONB,
  validation_results JSONB,
  config JSONB,
  symbols TEXT[],
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Model deployments table
CREATE TABLE public.model_deployments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID,
  version TEXT NOT NULL UNIQUE,
  metrics JSONB,
  config JSONB,
  deployed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Prediction logs table
CREATE TABLE public.prediction_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  prediction NUMERIC NOT NULL,
  confidence NUMERIC NOT NULL,
  latency NUMERIC NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  features JSONB,
  model_version TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Online learning logs table
CREATE TABLE public.online_learning_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  data_points INTEGER NOT NULL,
  update_metrics JSONB,
  symbols TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Drift alerts table
CREATE TABLE public.drift_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  resolved BOOLEAN NOT NULL DEFAULT false,
  features JSONB,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Stream buffers table for real-time data buffering
CREATE TABLE public.stream_buffers (
  id TEXT NOT NULL PRIMARY KEY,
  buffer_data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tick_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_book_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_learning_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drift_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_buffers ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access to market data
CREATE POLICY "Allow public read access to tick data" 
ON public.tick_data 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public read access to order book data" 
ON public.order_book_data 
FOR SELECT 
USING (true);

-- Create policies for authenticated users to access trading data
CREATE POLICY "Authenticated users can view training jobs" 
ON public.training_jobs 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create training jobs" 
ON public.training_jobs 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update training jobs" 
ON public.training_jobs 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view model deployments" 
ON public.model_deployments 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create model deployments" 
ON public.model_deployments 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update model deployments" 
ON public.model_deployments 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view prediction logs" 
ON public.prediction_logs 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create prediction logs" 
ON public.prediction_logs 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view online learning logs" 
ON public.online_learning_logs 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create online learning logs" 
ON public.online_learning_logs 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view drift alerts" 
ON public.drift_alerts 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create drift alerts" 
ON public.drift_alerts 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update drift alerts" 
ON public.drift_alerts 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view stream buffers" 
ON public.stream_buffers 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update stream buffers" 
ON public.stream_buffers 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Create indexes for performance
CREATE INDEX idx_tick_data_symbol_timestamp ON public.tick_data(symbol, timestamp DESC);
CREATE INDEX idx_tick_data_exchange_timestamp ON public.tick_data(exchange, timestamp DESC);
CREATE INDEX idx_order_book_symbol_timestamp ON public.order_book_data(symbol, timestamp DESC);
CREATE INDEX idx_training_jobs_status ON public.training_jobs(status);
CREATE INDEX idx_model_deployments_status ON public.model_deployments(status, deployed_at DESC);
CREATE INDEX idx_prediction_logs_symbol_timestamp ON public.prediction_logs(symbol, timestamp DESC);
CREATE INDEX idx_drift_alerts_type_severity ON public.drift_alerts(type, severity, resolved);

-- Create function to clean old data
CREATE OR REPLACE FUNCTION public.cleanup_old_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Delete tick data older than 7 days
  DELETE FROM public.tick_data 
  WHERE timestamp < now() - INTERVAL '7 days';
  
  -- Delete prediction logs older than 30 days
  DELETE FROM public.prediction_logs 
  WHERE timestamp < now() - INTERVAL '30 days';
  
  -- Delete online learning logs older than 30 days
  DELETE FROM public.online_learning_logs 
  WHERE timestamp < now() - INTERVAL '30 days';
  
  -- Mark resolved drift alerts older than 7 days as resolved
  UPDATE public.drift_alerts 
  SET resolved = true 
  WHERE timestamp < now() - INTERVAL '7 days' 
  AND resolved = false;
END;
$function$;