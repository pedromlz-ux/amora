-- Security hardening for patient-facing links, consultation uploads and custom foods.

ALTER TABLE public.diet_plans
  ADD COLUMN IF NOT EXISTS patient_access_token UUID NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS patient_access_expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '90 days');

UPDATE public.diet_plans
SET patient_access_token = COALESCE(patient_access_token, gen_random_uuid()),
    patient_access_expires_at = COALESCE(patient_access_expires_at, now() + interval '90 days');

CREATE UNIQUE INDEX IF NOT EXISTS diet_plans_patient_access_token_key
  ON public.diet_plans (patient_access_token);

-- Mobile recording links are short-lived bearer capabilities, rather than permanent links.
ALTER TABLE public.consultations
  ADD COLUMN IF NOT EXISTS session_expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '4 hours');

-- Required by the existing API upserts to guarantee one record per consultation.
CREATE UNIQUE INDEX IF NOT EXISTS consultation_records_consultation_id_key
  ON public.consultation_records (consultation_id);

-- Append chat messages atomically so concurrent patient/professional messages are not lost.
CREATE OR REPLACE FUNCTION public.append_diet_plan_chat(p_plan_id UUID, p_message JSONB)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.diet_plans
  SET patient_chat = COALESCE(patient_chat, '[]'::jsonb) || jsonb_build_array(p_message)
  WHERE id = p_plan_id
  RETURNING patient_chat;
$$;

REVOKE ALL ON FUNCTION public.append_diet_plan_chat(UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.append_diet_plan_chat(UUID, JSONB) TO service_role;

-- Atomically enforce the AI quota. A read-then-write counter can be bypassed with concurrent requests.
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
  FROM public.user_usage u WHERE u.user_id = p_user_id FOR UPDATE;

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

-- Custom foods are private to the nutritionist who created them.
DROP POLICY IF EXISTS "read_all_custom_foods" ON public.custom_foods;
DROP POLICY IF EXISTS "manage_own_custom_foods" ON public.custom_foods;
CREATE POLICY "manage_own_custom_foods" ON public.custom_foods
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
