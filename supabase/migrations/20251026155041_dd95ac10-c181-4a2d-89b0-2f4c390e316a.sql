-- Fix function search path security warning
-- Add explicit search_path to the upsert_market_data function

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
SET search_path = public
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