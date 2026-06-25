import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** Browser Supabase client (static pages + admin UI helpers). */
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseKey);
}
