'use strict';

const crypto = require('crypto');

const TOKEN_TTL_MS = 8 * 60 * 60 * 1000;

function getSecret() {
  return process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || '';
}

function createToken() {
  const secret = getSecret();
  if (!secret) return null;
  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = JSON.stringify({ exp, role: 'admin' });
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return Buffer.from(JSON.stringify({ payload: JSON.parse(payload), sig })).toString('base64url');
}

function verifyToken(token) {
  const secret = getSecret();
  if (!secret || !token) return false;
  try {
    const parsed = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));
    const payloadStr = JSON.stringify(parsed.payload);
    const expected = crypto.createHmac('sha256', secret).update(payloadStr).digest('hex');
    if (expected !== parsed.sig) return false;
    if (Date.now() > parsed.payload.exp) return false;
    return true;
  } catch {
    return false;
  }
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function getBearer(req) {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7) : '';
}

function supabaseHeaders() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return {
    apikey: key,
    Authorization: 'Bearer ' + key,
    'Content-Type': 'application/json',
  };
}

module.exports = { createToken, verifyToken, cors, getBearer, supabaseHeaders, getSecret };
