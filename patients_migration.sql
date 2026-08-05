-- ============================================================
-- AMORA — Migração: Módulo de Pacientes (Prontuário Nutricional)
-- Execute no SQL Editor do Supabase Dashboard
-- ============================================================

-- 1. Tabela principal de pacientes
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nutritionist_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  birth_date DATE,
  gender TEXT,
  objective TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Anamnese Nutricional
CREATE TABLE IF NOT EXISTS public.patient_anamnese (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  nutritionist_id UUID REFERENCES auth.users(id) NOT NULL,
  chief_complaint TEXT,
  food_history TEXT,
  meal_frequency TEXT,
  intolerances TEXT,
  pathologies TEXT,
  medications TEXT,
  physical_activity TEXT,
  sleep_quality TEXT,
  water_intake TEXT,
  bowel_habit TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Antropometria
CREATE TABLE IF NOT EXISTS public.patient_anthropometry (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  nutritionist_id UUID REFERENCES auth.users(id) NOT NULL,
  assessment_date DATE DEFAULT CURRENT_DATE,
  weight_kg NUMERIC(5,2),
  height_cm NUMERIC(5,1),
  imc NUMERIC(4,2),
  waist_cm NUMERIC(5,1),
  hip_cm NUMERIC(5,1),
  arm_cm NUMERIC(5,1),
  calf_cm NUMERIC(5,1),
  triceps_skinfold NUMERIC(4,1),
  subscapular_skinfold NUMERIC(4,1),
  abdominal_skinfold NUMERIC(4,1),
  suprailiac_skinfold NUMERIC(4,1),
  body_fat_pct NUMERIC(4,1),
  lean_mass_kg NUMERIC(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. BIA (Bioimpedância Elétrica)
CREATE TABLE IF NOT EXISTS public.patient_bia (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  nutritionist_id UUID REFERENCES auth.users(id) NOT NULL,
  assessment_date DATE DEFAULT CURRENT_DATE,
  weight_kg NUMERIC(5,2),
  body_fat_pct NUMERIC(4,1),
  fat_mass_kg NUMERIC(5,2),
  lean_mass_kg NUMERIC(5,2),
  muscle_mass_kg NUMERIC(5,2),
  total_body_water_pct NUMERIC(4,1),
  icw_l NUMERIC(4,1),
  ecw_l NUMERIC(4,1),
  bmr_kcal INT,
  visceral_fat_level INT,
  bone_mass_kg NUMERIC(4,2),
  phase_angle NUMERIC(4,2),
  device TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Exames (arquivos no Storage)
CREATE TABLE IF NOT EXISTS public.patient_exams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  nutritionist_id UUID REFERENCES auth.users(id) NOT NULL,
  exam_date DATE DEFAULT CURRENT_DATE,
  exam_type TEXT DEFAULT 'outro',
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Adiciona patient_id em diet_plans
ALTER TABLE public.diet_plans
  ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL;

-- RLS
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_anamnese ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_anthropometry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_bia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nutri_own_patients" ON public.patients FOR ALL USING (auth.uid() = nutritionist_id) WITH CHECK (auth.uid() = nutritionist_id);
CREATE POLICY "nutri_own_anamnese" ON public.patient_anamnese FOR ALL USING (auth.uid() = nutritionist_id) WITH CHECK (auth.uid() = nutritionist_id);
CREATE POLICY "nutri_own_anthropometry" ON public.patient_anthropometry FOR ALL USING (auth.uid() = nutritionist_id) WITH CHECK (auth.uid() = nutritionist_id);
CREATE POLICY "nutri_own_bia" ON public.patient_bia FOR ALL USING (auth.uid() = nutritionist_id) WITH CHECK (auth.uid() = nutritionist_id);
CREATE POLICY "nutri_own_exams" ON public.patient_exams FOR ALL USING (auth.uid() = nutritionist_id) WITH CHECK (auth.uid() = nutritionist_id);

-- Storage bucket (patient-exams — acesso privado)
INSERT INTO storage.buckets (id, name, public) VALUES ('patient-exams', 'patient-exams', false) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "nutri_upload_exams" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'patient-exams' AND auth.uid() IS NOT NULL);
CREATE POLICY "nutri_read_exams" ON storage.objects FOR SELECT USING (bucket_id = 'patient-exams' AND auth.uid() IS NOT NULL);
CREATE POLICY "nutri_delete_exams" ON storage.objects FOR DELETE USING (bucket_id = 'patient-exams' AND auth.uid() IS NOT NULL);
