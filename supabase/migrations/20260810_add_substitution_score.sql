-- Adiciona coluna substitution_score na tabela diet_plans e patients
ALTER TABLE diet_plans ADD COLUMN IF NOT EXISTS substitution_score INTEGER DEFAULT 70;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS substitution_score INTEGER DEFAULT 70;
