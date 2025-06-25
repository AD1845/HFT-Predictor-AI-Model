
-- Create table to store real-time market data
CREATE TABLE public.market_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  price DECIMAL(15,4) NOT NULL,
  change_amount DECIMAL(15,4),
  change_percent DECIMAL(8,4),
  volume BIGINT,
  market_cap BIGINT,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_source TEXT NOT NULL,
  UNIQUE(symbol, data_source)
);

-- Create table for market news
CREATE TABLE public.market_news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL,
  source TEXT NOT NULL,
  symbols TEXT[], -- Array of related symbols
  sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_market_data_symbol ON public.market_data(symbol);
CREATE INDEX idx_market_data_updated ON public.market_data(last_updated DESC);
CREATE INDEX idx_market_news_published ON public.market_news(published_at DESC);
CREATE INDEX idx_market_news_symbols ON public.market_news USING GIN(symbols);

-- Enable Row Level Security
ALTER TABLE public.market_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_news ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (market data should be public)
CREATE POLICY "Allow public read access to market data" 
  ON public.market_data 
  FOR SELECT 
  TO PUBLIC
  USING (true);

CREATE POLICY "Allow public read access to market news" 
  ON public.market_news 
  FOR SELECT 
  TO PUBLIC
  USING (true);

-- Create function to update market data (upsert)
CREATE OR REPLACE FUNCTION public.upsert_market_data(
  p_symbol TEXT,
  p_price DECIMAL(15,4),
  p_change_amount DECIMAL(15,4),
  p_change_percent DECIMAL(8,4),
  p_volume BIGINT,
  p_market_cap BIGINT,
  p_data_source TEXT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.market_data (
    symbol, price, change_amount, change_percent, volume, market_cap, data_source, last_updated
  ) VALUES (
    p_symbol, p_price, p_change_amount, p_change_percent, p_volume, p_market_cap, p_data_source, now()
  )
  ON CONFLICT (symbol, data_source) 
  DO UPDATE SET
    price = EXCLUDED.price,
    change_amount = EXCLUDED.change_amount,
    change_percent = EXCLUDED.change_percent,
    volume = EXCLUDED.volume,
    market_cap = EXCLUDED.market_cap,
    last_updated = EXCLUDED.last_updated;
END;
$$ LANGUAGE plpgsql;
