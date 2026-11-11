-- PostgreSQL treats output column names of a RETURNS TABLE function as
-- variables. Qualify the table column so the atomic quota update is not
-- ambiguous at runtime.
CREATE OR REPLACE FUNCTION public.consume_chat_quota(p_user_id UUID)
RETURNS TABLE (allowed BOOLEAN, plan TEXT, questions_count INTEGER, question_limit INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_plan TEXT;
  current_count INTEGER;
  max_questions INTEGER;
BEGIN
  INSERT INTO public.user_usage (user_id, plan, questions_count)
  VALUES (p_user_id, 'free', 0)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT u.plan, u.questions_count INTO current_plan, current_count
  FROM public.user_usage AS u WHERE u.user_id = p_user_id FOR UPDATE;

  max_questions := CASE current_plan
    WHEN 'admin' THEN NULL
    WHEN 'ultra' THEN 200
    WHEN 'premium' THEN 300
    ELSE 30
  END;

  IF max_questions IS NOT NULL AND current_count >= max_questions THEN
    RETURN QUERY SELECT false, current_plan, current_count, max_questions;
    RETURN;
  END IF;

  UPDATE public.user_usage AS usage
  SET questions_count = usage.questions_count + 1
  WHERE usage.user_id = p_user_id
  RETURNING usage.questions_count INTO current_count;

  RETURN QUERY SELECT true, current_plan, current_count, max_questions;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_chat_quota(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_chat_quota(UUID) TO service_role;
