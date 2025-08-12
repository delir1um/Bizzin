-- Calculator History Table
-- Run this SQL in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS calculator_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  calculator_type TEXT NOT NULL CHECK (calculator_type IN ('cash_flow', 'break_even', 'business_budget')),
  calculation_name TEXT NOT NULL CHECK (length(calculation_name) >= 1 AND length(calculation_name) <= 100),
  calculation_data JSONB NOT NULL,
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE calculator_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for users to manage their own calculations
CREATE POLICY "Users can manage own calculations" ON calculator_history
  FOR ALL USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_calculator_history_updated_at
    BEFORE UPDATE ON calculator_history
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS calculator_history_user_id_idx ON calculator_history(user_id);
CREATE INDEX IF NOT EXISTS calculator_history_calculator_type_idx ON calculator_history(calculator_type);
CREATE INDEX IF NOT EXISTS calculator_history_created_at_idx ON calculator_history(created_at DESC);

-- Test insert (remove after testing)
-- INSERT INTO calculator_history (user_id, calculator_type, calculation_name, calculation_data) 
-- VALUES (auth.uid(), 'cash_flow', 'Test Calculation', '{"test": true}');