-- ============================================================
-- AMORA — Migração: Consultas e Storage de Áudio
-- Execute no SQL Editor do Supabase Dashboard
-- ============================================================

-- 1. Criação do Bucket de Storage
INSERT INTO storage.buckets (id, name, public) 
VALUES ('consultations', 'consultations', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for 'consultations'
CREATE POLICY "Users can access their own consultation audios"
  ON storage.objects FOR ALL
  USING ( bucket_id = 'consultations' AND auth.uid()::text = (storage.foldername(name))[1] );

-- 2. Tabela principal de consultas
CREATE TABLE IF NOT EXISTS public.consultations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_token UUID DEFAULT gen_random_uuid(), -- Usado para o mobile-recorder autenticar a gravação
  status TEXT DEFAULT 'in_progress', -- in_progress, completed
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "manage_own_consultations" ON public.consultations FOR ALL USING (auth.uid() = user_id);

-- Permitir leitura e escrita por token (para a página mobile que pode estar deslogada, mas com o token)
-- Vamos criar uma política baseada no session_token, mas na prática a API gerenciará o upload, 
-- ou o usuário mobile precisará logar. Para simplificar e manter seguro, vamos permitir que
-- se a sessão for anônima, passe via API. (A RLS cuidará das leituras normais no frontend).

-- 3. Tabela de Registros da Consulta (Áudios e Relatórios)
CREATE TABLE IF NOT EXISTS public.consultation_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  consultation_id UUID REFERENCES public.consultations(id) ON DELETE CASCADE NOT NULL,
  audio_desktop_url TEXT,
  audio_mobile_url TEXT,
  raw_transcription TEXT,
  structured_report JSONB,
  additional_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.consultation_records ENABLE ROW LEVEL SECURITY;
-- Acesso via a tabela consultations
CREATE POLICY "manage_own_consultation_records" ON public.consultation_records 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.consultations c 
      WHERE c.id = consultation_records.consultation_id 
      AND c.user_id = auth.uid()
    )
  );

-- Habilitar CORS caso não esteja ativo e for necessário para o mobile
