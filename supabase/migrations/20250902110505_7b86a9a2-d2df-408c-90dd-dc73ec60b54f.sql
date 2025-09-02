-- Fix security warning by setting search_path for function
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;