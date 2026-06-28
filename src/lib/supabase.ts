// ===========================================================================
// Supabase client. Single shared instance for the whole app.
//
// Reads VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from the environment
// (see .env / .env.example). The anon key is public by design — Row Level
// Security on the backend is what actually protects the data.
// ===========================================================================

import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Fail loudly in dev rather than producing confusing 401s later.
  throw new Error(
    'Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env (see .env.example), then restart the dev server.',
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
