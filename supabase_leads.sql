-- Execute este script no SQL Editor do seu Dashboard no Supabase para criar a tabela de Leads

-- 1. Criar a tabela de leads para a landing page (LP)
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    whatsapp TEXT NOT NULL
);

-- 2. Ativar Row Level Security (RLS) para proteção contra acessos maliciosos
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- 3. Criar Política (Policy) que permite que qualquer visitante insira leads (público anônimo)
CREATE POLICY "Permitir insercao publica de leads"
ON public.leads
FOR INSERT
TO anon
WITH CHECK (true);

-- 4. Segurança Adicional: Sem políticas de SELECT, UPDATE ou DELETE por padrão.
-- Isso significa que QUALQUER tentativa de ler, alterar ou deletar os leads do banco pelo frontend
-- será 100% BLOQUEADA pela segurança nativa do Supabase (apenas você vê os dados pelo painel administrativo).
