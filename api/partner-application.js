'use strict';

const { getUrl, getServiceKey } = require('../../lib/supabase');

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function parseBody(req) {
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  return body || {};
}

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const url = getUrl();
  const key = getServiceKey();
  if (!url || !key) {
    return res.status(503).json({
      error: 'Server not configured. Set SUPABASE_SERVICE_ROLE_KEY in Vercel.',
    });
  }

  const body = parseBody(req);
  const name = (body.name || '').trim();
  const organization = (body.organization || '').trim();
  const email = (body.email || '').trim();
  const country = (body.country || '').trim();
  const site_type = (body.site_type || '').trim();
  const message = (body.message || '').trim();

  if (!name || !organization || !email || !country || !site_type || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  const row = {
    name,
    organization,
    email,
    phone: (body.phone || '').trim() || null,
    country,
    site_type,
    capacity: (body.capacity || '').trim() || null,
    message,
    language: (body.language || 'en').trim(),
    source: 'energiemind.network',
    status: 'new',
  };

  const table = process.env.SUPABASE_TABLE || 'partner_applications';
  const root = url.replace(/\/$/, '');

  try {
    const r = await fetch(`${root}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(row),
    });

    if (!r.ok) {
      const detail = await r.text();
      console.error('Partner insert failed:', detail);
      return res.status(502).json({ error: 'Could not save application', detail });
    }

    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error('Partner application error:', err);
    return res.status(500).json({ error: 'Server error', detail: String(err.message || err) });
  }
};
