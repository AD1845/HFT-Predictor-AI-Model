-- Create market_data table for real-time market data
CREATE TABLE public.market_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  price DECIMAL(20,8) NOT NULL,
  change_amount DECIMAL(20,8) NOT NULL DEFAULT 0,
  change_percent DECIMAL(10,4) NOT NULL DEFAULT 0,
  volume BIGINT NOT NULL DEFAULT 0,
  market_cap BIGINT,
  data_source TEXT NOT NULL DEFAULT 'live_api',
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trades table for storing trade records
CREATE TABLE public.trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  symbol TEXT NOT NULL,
  trade_type TEXT NOT NULL CHECK (trade_type IN ('buy', 'sell')),
  amount DECIMAL(20,8) NOT NULL,
  price DECIMAL(20,8) NOT NULL,
  status TEXT NOT NULL DEFAULT 'executed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create hft_signals table for storing HFT strategy signals
CREATE TABLE public.hft_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  strategy TEXT NOT NULL,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('buy', 'sell', 'hold')),
  confidence DECIMAL(5,4) NOT NULL DEFAULT 0,
  price DECIMAL(20,8) NOT NULL,
  volume BIGINT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_market_data_symbol ON public.market_data(symbol);
CREATE INDEX idx_market_data_symbol_updated ON public.market_data(symbol, last_updated DESC);
CREATE INDEX idx_trades_user_id ON public.trades(user_id);
CREATE INDEX idx_trades_symbol ON public.trades(symbol);
CREATE INDEX idx_hft_signals_symbol ON public.hft_signals(symbol);
CREATE INDEX idx_hft_signals_strategy ON public.hft_signals(strategy);
CREATE INDEX idx_hft_signals_created_at ON public.hft_signals(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.market_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hft_signals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public access (no authentication required)
CREATE POLICY "Public access to market data" 
ON public.market_data 
FOR ALL 
USING (true);

CREATE POLICY "Public access to trades" 
ON public.trades 
FOR ALL 
USING (true);

CREATE POLICY "Public access to HFT signals" 
ON public.hft_signals 
FOR ALL 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates on market_data
CREATE TRIGGER update_market_data_updated_at
  BEFORE UPDATE ON public.market_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();