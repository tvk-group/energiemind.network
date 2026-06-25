const { createServiceClient } = require('../../lib/supabase');

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabase = createServiceClient();
  if (!supabase) {
    return res.status(503).json({
      error: 'Server not configured. Set SUPABASE_SERVICE_ROLE_KEY in Vercel.',
    });
  }

  const body = req.body || {};
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
  const { error } = await supabase.from(table).insert(row);

  if (error) {
    console.error('Partner application insert failed:', error.message);
    return res.status(502).json({ error: 'Could not save application', detail: error.message });
  }

  return res.status(201).json({ ok: true });
};
