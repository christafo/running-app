-- Add missing UPDATE policies for runs and routes tables
-- This enables persistence of edits in the application
-- Note: If policies already exist, you may need to drop them first

-- Add UPDATE policy for runs table
CREATE POLICY "Users can update their own runs" 
ON runs
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add UPDATE policy for routes table
CREATE POLICY "Users can update their own routes" 
ON routes
FOR UPDATE 
USING (auth.uid() = user_id);
