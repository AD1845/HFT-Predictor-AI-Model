-- Update HFT database policies to remove authentication requirements and allow public access

-- Drop existing policies that require authentication
DROP POLICY "Authenticated users can view training jobs" ON public.training_jobs;
DROP POLICY "Authenticated users can create training jobs" ON public.training_jobs;
DROP POLICY "Authenticated users can update training jobs" ON public.training_jobs;
DROP POLICY "Authenticated users can view model deployments" ON public.model_deployments;
DROP POLICY "Authenticated users can create model deployments" ON public.model_deployments;
DROP POLICY "Authenticated users can update model deployments" ON public.model_deployments;
DROP POLICY "Authenticated users can view prediction logs" ON public.prediction_logs;
DROP POLICY "Authenticated users can create prediction logs" ON public.prediction_logs;
DROP POLICY "Authenticated users can view online learning logs" ON public.online_learning_logs;
DROP POLICY "Authenticated users can create online learning logs" ON public.online_learning_logs;
DROP POLICY "Authenticated users can view drift alerts" ON public.drift_alerts;
DROP POLICY "Authenticated users can create drift alerts" ON public.drift_alerts;
DROP POLICY "Authenticated users can update drift alerts" ON public.drift_alerts;
DROP POLICY "Authenticated users can view stream buffers" ON public.stream_buffers;
DROP POLICY "Authenticated users can update stream buffers" ON public.stream_buffers;

-- Create new public access policies for all HFT tables
CREATE POLICY "Allow public read access to training jobs" 
ON public.training_jobs 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public create access to training jobs" 
ON public.training_jobs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update access to training jobs" 
ON public.training_jobs 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public read access to model deployments" 
ON public.model_deployments 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public create access to model deployments" 
ON public.model_deployments 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update access to model deployments" 
ON public.model_deployments 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public read access to prediction logs" 
ON public.prediction_logs 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public create access to prediction logs" 
ON public.prediction_logs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public read access to online learning logs" 
ON public.online_learning_logs 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public create access to online learning logs" 
ON public.online_learning_logs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public read access to drift alerts" 
ON public.drift_alerts 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public create access to drift alerts" 
ON public.drift_alerts 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update access to drift alerts" 
ON public.drift_alerts 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public read access to stream buffers" 
ON public.stream_buffers 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public write access to stream buffers" 
ON public.stream_buffers 
FOR ALL 
USING (true);

-- Also update user_trades to allow public access
DROP POLICY "Users can view their own trades" ON public.user_trades;
DROP POLICY "Users can insert their own trades" ON public.user_trades;
DROP POLICY "Users can update their own trades" ON public.user_trades;

CREATE POLICY "Allow public read access to trades" 
ON public.user_trades 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public create access to trades" 
ON public.user_trades 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update access to trades" 
ON public.user_trades 
FOR UPDATE 
USING (true);