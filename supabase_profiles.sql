-- Criar a tabela de perfis (profiles) ligada à tabela de autenticação auth.users
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone
);

-- Ativar Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Política: Usuários podem ver apenas seus próprios perfis
create policy "Users can view own profile."
  on profiles for select
  using ( auth.uid() = id );

-- Política: Usuários podem inserir seus próprios perfis
create policy "Users can insert own profile."
  on profiles for insert
  with check ( auth.uid() = id );

-- Política: Usuários podem atualizar seus próprios perfis
create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Função Trigger para criar um profile automaticamente após o cadastro (Sign Up)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;

-- Criar a trigger que escuta inserções na tabela auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
