const { verifyToken, cors, getBearer, supabaseHeaders } = require('../../lib/admin-auth');

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = getBearer(req);
  if (!verifyToken(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) {
    return res.status(503).json({ error: 'Supabase not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.' });
  }

  const table = process.env.SUPABASE_TABLE || 'partner_applications';
  const root = base.replace(/\/$/, '');

  if (req.method === 'GET') {
    const status = req.query.status;
    let url = `${root}/rest/v1/${table}?select=*&order=created_at.desc`;
    if (status) url += `&status=eq.${encodeURIComponent(status)}`;

    const r = await fetch(url, { headers: supabaseHeaders() });
    if (!r.ok) {
      const err = await r.text();
      return res.status(502).json({ error: 'Failed to fetch applications', detail: err });
    }
    const data = await r.json();
    return res.status(200).json({ applications: data });
  }

  if (req.method === 'PATCH') {
    const { id, status } = req.body || {};
    if (!id || !status) return res.status(400).json({ error: 'id and status required' });

    const allowed = ['new', 'reviewing', 'approved', 'declined'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const r = await fetch(`${root}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { ...supabaseHeaders(), Prefer: 'return=representation' },
      body: JSON.stringify({ status }),
    });

    if (!r.ok) {
      const err = await r.text();
      return res.status(502).json({ error: 'Failed to update', detail: err });
    }
    const data = await r.json();
    return res.status(200).json({ application: data[0] });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
