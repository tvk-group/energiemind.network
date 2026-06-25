const { createToken, cors, getSecret } = require('../../lib/admin-auth');

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!getSecret()) {
    return res.status(503).json({ error: 'Admin not configured. Set ADMIN_PASSWORD in Vercel env.' });
  }

  const { password } = req.body || {};
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({
      error: 'Invalid password. This must match the ADMIN_PASSWORD value in your Vercel project settings.',
    });
  }

  const token = createToken();
  if (!token) return res.status(503).json({ error: 'Could not create session' });

  return res.status(200).json({ token });
};
