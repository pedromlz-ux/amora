-- Execute este script no SQL Editor do seu Dashboard no Supabase
-- Ele cria a tabela de conversas e ativa a segurança via Row Level Security (RLS)

-- 1. Criar a tabela de chats (conversas)
CREATE TABLE IF NOT EXISTS public.chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Nova conversa',
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Ativar Row Level Security (RLS)
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- 3. Criar Políticas (Policies) de Segurança RLS
-- Apenas o próprio usuário pode ver seus chats
CREATE POLICY "Users can view own chats"
    ON public.chats
    FOR SELECT
    USING (auth.uid() = user_id);

-- Apenas o próprio usuário pode inserir seus chats
CREATE POLICY "Users can insert own chats"
    ON public.chats
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Apenas o próprio usuário pode atualizar seus chats
CREATE POLICY "Users can update own chats"
    ON public.chats
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Apenas o próprio usuário pode deletar seus chats
CREATE POLICY "Users can delete own chats"
    ON public.chats
    FOR DELETE
    USING (auth.uid() = user_id);
