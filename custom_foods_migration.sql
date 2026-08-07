-- ============================================================
-- AMORA — Migração: Meus Alimentos
-- Execute no SQL Editor do Supabase Dashboard
-- ============================================================

CREATE TABLE IF NOT EXISTS public.custom_foods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  energy_kcal NUMERIC(10,2),
  carbohydrate_g NUMERIC(10,2),
  protein_g NUMERIC(10,2),
  lipid_g NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.custom_foods ENABLE ROW LEVEL SECURITY;

-- Política: qualquer usuário autenticado pode ler (SELECT) todos os alimentos
CREATE POLICY "read_all_custom_foods" ON public.custom_foods FOR SELECT USING (auth.role() = 'authenticated');

-- Política: o usuário só pode editar/deletar seus próprios alimentos
CREATE POLICY "manage_own_custom_foods" ON public.custom_foods FOR ALL USING (auth.uid() = user_id);
