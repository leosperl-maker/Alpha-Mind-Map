import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';

/** True when no real Supabase project is configured — all auth/DB ops run locally */
export const isMockMode = !SUPABASE_URL || !SUPABASE_ANON_KEY;

export const supabase = isMockMode
  ? null
  : createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
