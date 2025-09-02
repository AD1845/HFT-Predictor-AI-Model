-- Create missing tables for HFT data
CREATE TABLE IF NOT EXISTS public.tick_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  price DECIMAL(20,8) NOT NULL,
  volume BIGINT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  exchange TEXT NOT NULL,
  bid DECIMAL(20,8),
  ask DECIMAL(20,8),
  spread DECIMAL(20,8),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_book_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  bids JSONB NOT NULL,
  asks JSONB NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  exchange TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tick_data_symbol_timestamp ON public.tick_data(symbol, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_order_book_symbol_timestamp ON public.order_book_data(symbol, timestamp DESC);

-- Enable RLS
ALTER TABLE public.tick_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_book_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public access
DROP POLICY IF EXISTS "Public access to tick data" ON public.tick_data;
CREATE POLICY "Public access to tick data" 
ON public.tick_data 
FOR ALL 
USING (true);

DROP POLICY IF EXISTS "Public access to order book data" ON public.order_book_data;
CREATE POLICY "Public access to order book data" 
ON public.order_book_data 
FOR ALL 
USING (true);

-- Create the missing RPC function for upserting market data
CREATE OR REPLACE FUNCTION public.upsert_market_data(
  p_symbol TEXT,
  p_price DECIMAL,
  p_change_amount DECIMAL DEFAULT 0,
  p_change_percent DECIMAL DEFAULT 0,
  p_volume BIGINT DEFAULT 0,
  p_market_cap BIGINT DEFAULT NULL,
  p_data_source TEXT DEFAULT 'api'
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.market_data (
    symbol, price, change_amount, change_percent, volume, market_cap, data_source, last_updated
  ) VALUES (
    p_symbol, p_price, p_change_amount, p_change_percent, p_volume, p_market_cap, p_data_source, now()
  )
  ON CONFLICT (symbol, data_source) DO UPDATE SET
    price = EXCLUDED.price,
    change_amount = EXCLUDED.change_amount,
    change_percent = EXCLUDED.change_percent,
    volume = EXCLUDED.volume,
    market_cap = EXCLUDED.market_cap,
    last_updated = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add unique constraint to support upsert
ALTER TABLE public.market_data DROP CONSTRAINT IF EXISTS unique_symbol_data_source;
ALTER TABLE public.market_data ADD CONSTRAINT unique_symbol_data_source UNIQUE (symbol, data_source);