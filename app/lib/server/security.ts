import 'server-only';

import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

const MAX_JSON_BYTES = 10 * 1024 * 1024;

export function getServiceSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Configuração do Supabase ausente no servidor.');
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function getAuthenticatedUser(request: Request): Promise<User | null> {
  const authorization = request.headers.get('authorization');
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  const { data, error } = await getServiceSupabase().auth.getUser(match[1]);
  return error ? null : data.user;
}

export function getPatientAccessToken(request: Request): string | null {
  const token = request.headers.get('x-patient-access');
  return token && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token)
    ? token
    : null;
}

export function requestIsTooLarge(request: Request, maxBytes = MAX_JSON_BYTES): boolean {
  const value = Number(request.headers.get('content-length') ?? 0);
  return Number.isFinite(value) && value > maxBytes;
}

export function isNonEmptyString(value: unknown, maxLength: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;
}
