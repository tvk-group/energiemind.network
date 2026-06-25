const { verifyToken, cors, getBearer } = require('../../lib/admin-auth');
const { createServiceClient } = require('../../lib/supabase');

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = getBearer(req);
  if (!verifyToken(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return res.status(503).json({
      error: 'Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    });
  }

  const table = process.env.SUPABASE_TABLE || 'partner_applications';

  if (req.method === 'GET') {
    const status = req.query.status;
    let query = supabase.from(table).select('*').order('created_at', { ascending: false });
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) return res.status(502).json({ error: 'Failed to fetch applications', detail: error.message });
    return res.status(200).json({ applications: data });
  }

  if (req.method === 'PATCH') {
    const { id, status } = req.body || {};
    if (!id || !status) return res.status(400).json({ error: 'id and status required' });

    const allowed = ['new', 'reviewing', 'approved', 'declined'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const { data, error } = await supabase
      .from(table)
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(502).json({ error: 'Failed to update', detail: error.message });
    return res.status(200).json({ application: data });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
