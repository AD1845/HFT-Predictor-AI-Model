-- Recreate all trading platform tables with proper RLS policies

-- Create trades table
CREATE TABLE IF NOT EXISTS public.trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  trade_type TEXT NOT NULL,
  price NUMERIC NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create hft_signals table
CREATE TABLE IF NOT EXISTS public.hft_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  signal_type TEXT NOT NULL,
  strategy TEXT NOT NULL,
  price NUMERIC NOT NULL,
  confidence NUMERIC NOT NULL DEFAULT 0,
  volume NUMERIC,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create market_data table (authenticated access only)
CREATE TABLE IF NOT EXISTS public.market_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL UNIQUE,
  price NUMERIC NOT NULL,
  change_amount NUMERIC NOT NULL DEFAULT 0,
  change_percent NUMERIC NOT NULL DEFAULT 0,
  volume NUMERIC NOT NULL DEFAULT 0,
  market_cap NUMERIC,
  data_source TEXT NOT NULL DEFAULT 'binance',
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tick_data table (authenticated access only)
CREATE TABLE IF NOT EXISTS public.tick_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  price NUMERIC NOT NULL,
  volume NUMERIC NOT NULL,
  bid NUMERIC,
  ask NUMERIC,
  spread NUMERIC,
  exchange TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order_book_data table (authenticated access only)
CREATE TABLE IF NOT EXISTS public.order_book_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  bids JSONB NOT NULL,
  asks JSONB NOT NULL,
  exchange TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hft_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tick_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_book_data ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON public.trades(user_id);
CREATE INDEX IF NOT EXISTS idx_hft_signals_user_id ON public.hft_signals(user_id);
CREATE INDEX IF NOT EXISTS idx_hft_signals_user_strategy ON public.hft_signals(user_id, strategy);
CREATE INDEX IF NOT EXISTS idx_market_data_symbol ON public.market_data(symbol);
CREATE INDEX IF NOT EXISTS idx_tick_data_symbol_timestamp ON public.tick_data(symbol, timestamp);
CREATE INDEX IF NOT EXISTS idx_order_book_symbol_timestamp ON public.order_book_data(symbol, timestamp);

-- RLS Policies for trades table (user-specific)
CREATE POLICY "Users can view own trades" 
ON public.trades 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trades" 
ON public.trades 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trades" 
ON public.trades 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trades" 
ON public.trades 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for hft_signals table (user-specific)
CREATE POLICY "Users can view own HFT signals" 
ON public.hft_signals 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own HFT signals" 
ON public.hft_signals 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own HFT signals" 
ON public.hft_signals 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own HFT signals" 
ON public.hft_signals 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for market_data table (authenticated users can read, service role can write)
CREATE POLICY "Authenticated users can view market data" 
ON public.market_data 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Service role can manage market data" 
ON public.market_data 
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- RLS Policies for tick_data table (authenticated users can read, service role can write)
CREATE POLICY "Authenticated users can view tick data" 
ON public.tick_data 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Service role can manage tick data" 
ON public.tick_data 
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- RLS Policies for order_book_data table (authenticated users can read, service role can write)
CREATE POLICY "Authenticated users can view order book data" 
ON public.order_book_data 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Service role can manage order book data" 
ON public.order_book_data 
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create function for upserting market data
CREATE OR REPLACE FUNCTION public.upsert_market_data(
  p_symbol TEXT,
  p_price NUMERIC,
  p_change_amount NUMERIC DEFAULT 0,
  p_change_percent NUMERIC DEFAULT 0,
  p_volume NUMERIC DEFAULT 0,
  p_market_cap NUMERIC DEFAULT NULL,
  p_data_source TEXT DEFAULT 'binance'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.market_data (
    symbol, price, change_amount, change_percent, volume, market_cap, data_source, last_updated
  )
  VALUES (
    p_symbol, p_price, p_change_amount, p_change_percent, p_volume, p_market_cap, p_data_source, now()
  )
  ON CONFLICT (symbol) 
  DO UPDATE SET
    price = EXCLUDED.price,
    change_amount = EXCLUDED.change_amount,
    change_percent = EXCLUDED.change_percent,
    volume = EXCLUDED.volume,
    market_cap = EXCLUDED.market_cap,
    data_source = EXCLUDED.data_source,
    last_updated = now();
END;
$$;