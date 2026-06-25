/**
 * Supabase SSR middleware helper.
 * Used by Vercel Edge middleware (middleware.js) to refresh auth sessions.
 * Adapted from Supabase Next.js SSR docs for this static-site deployment.
 */
import { createServerClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY;

export async function updateSession(request) {
  let supabaseResponse = new Response(null, {
    status: 200,
    headers: request.headers,
  });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get('cookie') || '');
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.headers.append(
            'Set-Cookie',
            serializeCookie(name, value, options)
          );
        });
      },
    },
  });

  await supabase.auth.getUser();
  return supabaseResponse;
}

function parseCookieHeader(header) {
  if (!header) return [];
  return header.split(';').map((part) => {
    const [name, ...rest] = part.trim().split('=');
    return { name, value: rest.join('=') };
  });
}

function serializeCookie(name, value, options = {}) {
  let str = `${name}=${value}`;
  if (options.maxAge) str += `; Max-Age=${options.maxAge}`;
  if (options.path) str += `; Path=${options.path}`;
  if (options.httpOnly) str += '; HttpOnly';
  if (options.secure) str += '; Secure';
  if (options.sameSite) str += `; SameSite=${options.sameSite}`;
  return str;
}
