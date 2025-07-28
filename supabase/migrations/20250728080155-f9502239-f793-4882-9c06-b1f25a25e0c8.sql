-- Create user profiles table with proper security
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'trader',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create user_trades table for tracking trades with proper security
CREATE TABLE public.user_trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  trade_type TEXT NOT NULL CHECK (trade_type IN ('buy', 'sell')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  price NUMERIC NOT NULL CHECK (price > 0),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'executed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  executed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on user_trades
ALTER TABLE public.user_trades ENABLE ROW LEVEL SECURITY;

-- Create policies for user_trades
CREATE POLICY "Users can view their own trades" 
ON public.user_trades 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trades" 
ON public.user_trades 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trades" 
ON public.user_trades 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Fix the existing upsert_market_data function with proper security
CREATE OR REPLACE FUNCTION public.upsert_market_data(
  p_symbol text, 
  p_price numeric, 
  p_change_amount numeric, 
  p_change_percent numeric, 
  p_volume bigint, 
  p_market_cap bigint, 
  p_data_source text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Validate inputs
  IF p_symbol IS NULL OR trim(p_symbol) = '' THEN
    RAISE EXCEPTION 'Symbol cannot be empty';
  END IF;
  
  IF p_price IS NULL OR p_price < 0 THEN
    RAISE EXCEPTION 'Price must be positive';
  END IF;
  
  IF p_data_source IS NULL OR trim(p_data_source) = '' THEN
    RAISE EXCEPTION 'Data source cannot be empty';
  END IF;

  INSERT INTO public.market_data (
    symbol, price, change_amount, change_percent, volume, market_cap, data_source, last_updated
  ) VALUES (
    trim(upper(p_symbol)), p_price, p_change_amount, p_change_percent, p_volume, p_market_cap, trim(p_data_source), now()
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
$$;

-- Create function to handle user profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (
    new.id, 
    new.email,
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  RETURN new;
END;
$$;

-- Create trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();