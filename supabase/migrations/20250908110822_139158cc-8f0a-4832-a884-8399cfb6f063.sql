-- Fix critical security vulnerability in hft_signals table
-- Remove public access and implement proper user-based access control

-- Drop the existing public access policy
DROP POLICY IF EXISTS "Public access to HFT signals" ON public.hft_signals;

-- Add user_id column to associate signals with users
ALTER TABLE public.hft_signals 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_hft_signals_user_id ON public.hft_signals(user_id);
CREATE INDEX IF NOT EXISTS idx_hft_signals_user_strategy ON public.hft_signals(user_id, strategy);

-- Set default user_id for existing records (will need to be updated by application logic)
-- For now, we'll leave existing records with NULL user_id and they won't be accessible

-- Create secure RLS policies for authenticated users only
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
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own HFT signals" 
ON public.hft_signals 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Add a check constraint to ensure user_id is provided for new records
ALTER TABLE public.hft_signals 
ADD CONSTRAINT hft_signals_user_id_required 
CHECK (user_id IS NOT NULL OR created_at < now());