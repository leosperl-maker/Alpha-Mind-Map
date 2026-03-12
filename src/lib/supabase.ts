import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

/** True when no real Supabase project is configured — all auth/DB ops run locally */
export const isMockMode =
  !supabaseUrl ||
  supabaseUrl === 'https://placeholder.supabase.co' ||
  supabaseUrl.includes('placeholder');

export const supabase = isMockMode
  ? null
  : createClient(supabaseUrl, supabaseAnonKey);
