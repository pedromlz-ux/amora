-- Adiciona a coluna patient_chat para guardar o chat persistente entre o paciente e o profissional
ALTER TABLE diet_plans ADD COLUMN IF NOT EXISTS patient_chat jsonb DEFAULT '[]'::jsonb;
