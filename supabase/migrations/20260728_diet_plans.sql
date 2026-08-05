-- Diet Plans table
CREATE TABLE IF NOT EXISTS diet_plans (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_name   text NOT NULL DEFAULT 'Plano sem título',
  patient_name text,
  diet_notes  text,
  meals       jsonb NOT NULL DEFAULT '[]',
  macros      jsonb,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- Index for fast per-user queries
CREATE INDEX IF NOT EXISTS diet_plans_user_id_idx ON diet_plans (user_id, updated_at DESC);

-- Enable Row Level Security
ALTER TABLE diet_plans ENABLE ROW LEVEL SECURITY;

-- Policy: users can only read their own plans
CREATE POLICY "diet_plans_select_own" ON diet_plans
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: users can only insert for themselves
CREATE POLICY "diet_plans_insert_own" ON diet_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: users can only update their own plans
CREATE POLICY "diet_plans_update_own" ON diet_plans
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: users can only delete their own plans
CREATE POLICY "diet_plans_delete_own" ON diet_plans
  FOR DELETE USING (auth.uid() = user_id);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ language 'plpgsql';

CREATE TRIGGER diet_plans_updated_at
  BEFORE UPDATE ON diet_plans
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
