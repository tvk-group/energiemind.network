const { verifyToken, cors, getBearer } = require('../../lib/admin-auth');
const { getUrl, getServiceKey } = require('../../lib/supabase');

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

function supabaseHeaders() {
  const key = getServiceKey();
  return {
    apikey: key,
    Authorization: 'Bearer ' + key,
    'Content-Type': 'application/json',
  };
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = getBearer(req);
  if (!verifyToken(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const base = getUrl();
  const key = getServiceKey();
  if (!base || !key) {
    return res.status(503).json({
      error: 'Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    });
  }

  const table = process.env.SUPABASE_TABLE || 'partner_applications';
  const root = base.replace(/\/$/, '');

  if (req.method === 'GET') {
    const status = req.query.status;
    let url = `${root}/rest/v1/${table}?select=*&order=created_at.desc`;
    if (status) url += `&status=eq.${encodeURIComponent(status)}`;

    try {
      const r = await fetch(url, { headers: supabaseHeaders() });
      if (!r.ok) {
        const detail = await r.text();
        return res.status(502).json({ error: 'Failed to fetch applications', detail });
      }
      const data = await r.json();
      return res.status(200).json({ applications: data });
    } catch (err) {
      return res.status(500).json({ error: 'Server error', detail: String(err.message || err) });
    }
  }

  if (req.method === 'PATCH') {
    const { id, status } = parseBody(req);
    if (!id || !status) return res.status(400).json({ error: 'id and status required' });

    const allowed = ['new', 'reviewing', 'approved', 'declined'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    try {
      const r = await fetch(`${root}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { ...supabaseHeaders(), Prefer: 'return=representation' },
        body: JSON.stringify({ status }),
      });

      if (!r.ok) {
        const detail = await r.text();
        return res.status(502).json({ error: 'Failed to update', detail });
      }
      const data = await r.json();
      return res.status(200).json({ application: data[0] });
    } catch (err) {
      return res.status(500).json({ error: 'Server error', detail: String(err.message || err) });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
