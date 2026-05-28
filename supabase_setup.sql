-- Execute este script no SQL Editor do seu Dashboard no Supabase

-- 1. Criar a tabela user_usage para armazenar o uso das perguntas e o plano
CREATE TABLE IF NOT EXISTS public.user_usage (
    user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
    plan TEXT NOT NULL DEFAULT 'free', -- 'free' ou 'premium'
    questions_count INT NOT NULL DEFAULT 0,
    last_reset TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    subscription_id TEXT,
    subscription_status TEXT
);

-- 2. Ativar RLS para garantir que os dados não possam ser editados pelo frontend maliciosamente
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

-- 3. Criar Política (Policy) para que o próprio usuário possa apenas LER seus próprios dados
CREATE POLICY "Users can read own usage" 
ON public.user_usage 
FOR SELECT 
USING (auth.uid() = user_id);

-- 4. Criar uma função (Trigger) que cria a linha de uso assim que um novo usuário se registra no Supabase (se você usa Auth)
CREATE OR REPLACE FUNCTION public.handle_new_user_usage()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_usage (user_id, plan, questions_count)
  VALUES (new.id, 'free', 0);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- (Opcional) Cria o trigger para novos usuários
DROP TRIGGER IF EXISTS on_auth_user_created_usage ON auth.users;
CREATE TRIGGER on_auth_user_created_usage
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_usage();
