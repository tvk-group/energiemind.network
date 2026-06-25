'use strict';

function getUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
}

function getServiceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

function createServiceClient() {
  const url = getUrl();
  const key = getServiceKey();
  if (!url || !key) return null;
  try {
    const { createClient } = require('@supabase/supabase-js');
    return createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } catch (err) {
    console.error('Supabase client init failed:', err);
    return null;
  }
}

module.exports = { createServiceClient, getUrl, getServiceKey };
