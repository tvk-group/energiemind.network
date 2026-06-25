import { createBrowserClient } from '@supabase/ssr';

export function createClient(url, key) {
  return createBrowserClient(url, key);
}

export async function insertPartnerApplication(url, key, table, row) {
  const supabase = createBrowserClient(url, key);
  const { error } = await supabase.from(table).insert(row);
  if (error) throw error;
  return true;
}
