-- Fix critical security vulnerability in trades table
-- Remove existing permissive policy and implement proper user-scoped access

-- First, drop the existing overly permissive policy
DROP POLICY IF EXISTS "Public access to trades" ON public.trades;

-- Make user_id column NOT NULL for security (it should always be set)
ALTER TABLE public.trades 
ALTER COLUMN user_id SET NOT NULL;

-- Add constraint to ensure user_id references actual auth users
ALTER TABLE public.trades 
ADD CONSTRAINT trades_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create secure RLS policies that only allow users to access their own trades

-- Policy 1: Users can only view their own trades
CREATE POLICY "Users can view own trades" 
ON public.trades 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Policy 2: Users can only insert trades for themselves
CREATE POLICY "Users can insert own trades" 
ON public.trades 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can only update their own trades
CREATE POLICY "Users can update own trades" 
ON public.trades 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can only delete their own trades
CREATE POLICY "Users can delete own trades" 
ON public.trades 
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- Create index for better performance on user queries
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON public.trades(user_id);

-- Create index for user trading history queries
CREATE INDEX IF NOT EXISTS idx_trades_user_created ON public.trades(user_id, created_at DESC);