-- Habilitar a extensão pgvector
create extension if not exists vector;

-- Criar a tabela de documentos
create table documents (
  id bigserial primary key,
  content text, -- o texto do documento
  metadata jsonb, -- metadados como nome do arquivo, página, etc.
  embedding vector(768) -- tamanho do embedding do Gemini (normalmente 768)
);

-- Criar índice HNSW para busca rápida (opcional, mas recomendado)
create index on documents using hnsw (embedding vector_cosine_ops);

-- Função para buscar documentos similares
create or replace function match_documents (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where 1 - (documents.embedding <=> query_embedding) > match_threshold
  order by documents.embedding <=> query_embedding
  limit match_count;
$$;
