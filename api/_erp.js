// Pembantu bersama untuk integrasi ERP Tigalapan -> WOS (awalan "_" = bukan rute Vercel).
const crypto = require('crypto');

function cfg() {
  return {
    url: (process.env.SUPABASE_URL || '').replace(/\/+$/, ''),
    key: process.env.SUPABASE_SERVICE_KEY || '',
    secret: process.env.ERP_WEBHOOK_SECRET || '',
    viewPassword: process.env.ERP_VIEW_PASSWORD || '',
    erpBase: (process.env.ERP_BASE_URL || '').replace(/\/+$/, ''),
  };
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

function sbHeaders(c, extra) {
  return Object.assign({ apikey: c.key, Authorization: 'Bearer ' + c.key }, extra || {});
}

async function sbRpc(c, fn, args) {
  const r = await fetch(c.url + '/rest/v1/rpc/' + fn, { method: 'POST', headers: sbHeaders(c, { 'Content-Type': 'application/json' }), body: JSON.stringify(args) });
  if (!r.ok) throw new Error('RPC ' + fn + ' gagal: HTTP ' + r.status + ' ' + (await r.text()).slice(0, 300));
}

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

module.exports = { cfg, safeEqual, sbHeaders, sbRpc, json };
