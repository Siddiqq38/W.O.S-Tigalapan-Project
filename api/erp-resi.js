// POST /api/erp-resi -- penerima data resi dari ERP Tigalapan (webhook "resi.created").
// Memeriksa tanda tangan, menyimpan resi + koli + item ke Supabase (idempoten), lalu mengunduh lampiran resi ke Storage.
// Spesifikasi kiriman: docs/erp-integrasi/PANDUAN.md. Env: SUPABASE_URL, SUPABASE_SERVICE_KEY, ERP_WEBHOOK_SECRET, (opsional) ERP_BASE_URL.
const crypto = require('crypto');
const { cfg, safeEqual, sbHeaders, sbRpc, json } = require('./_erp');

const MAX_FILES = 10;
const MAX_FILE_BYTES = 6 * 1024 * 1024;
const BUCKET = 'erp-resi-files';

async function rawBody(req) {
  if (typeof req.body === 'string') return req.body;
  if (Buffer.isBuffer(req.body)) return req.body.toString('utf8');
  const chunks = [];
  if (typeof req[Symbol.asyncIterator] === 'function') for await (const ch of req) chunks.push(Buffer.from(ch));
  if (chunks.length) return Buffer.concat(chunks).toString('utf8');
  return req.body && typeof req.body === 'object' ? JSON.stringify(req.body) : '';
}

function header(req, name) {
  const v = req.headers[name];
  return Array.isArray(v) ? v[0] : v || '';
}

function extFor(contentType) {
  return { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'application/pdf': '.pdf' }[contentType] || '';
}

// Hanya mengunduh dari alamat ERP (https; dan kalau ERP_BASE_URL diisi, harus asal yang sama) supaya kiriman tidak bisa menyuruh server mengambil alamat lain.
function allowedErpUrl(c, url) {
  let u;
  try { u = new URL(url); } catch (e) { return false; }
  if (u.protocol !== 'https:') return false;
  return !c.erpBase || u.origin === new URL(c.erpBase).origin;
}

async function listAttachmentUrls(c, att) {
  if (!att) return [];
  if (att.manifestUrl && allowedErpUrl(c, att.manifestUrl)) {
    const r = await fetch(att.manifestUrl);
    if (r.ok) {
      const m = await r.json();
      if (Array.isArray(m.files)) return m.files;
    }
  }
  return Array.isArray(att.files) ? att.files : [];
}

async function saveAttachments(c, rid, att) {
  const files = (await listAttachmentUrls(c, att)).slice(0, MAX_FILES);
  const saved = [];
  for (const f of files) {
    if (!f || !allowedErpUrl(c, f.url)) throw new Error('Alamat lampiran tidak diizinkan.');
    const r = await fetch(f.url);
    if (!r.ok) throw new Error('Unduh lampiran gagal: HTTP ' + r.status);
    const bytes = Buffer.from(await r.arrayBuffer());
    if (bytes.length > MAX_FILE_BYTES) throw new Error('Lampiran terlalu besar.');
    const contentType = (r.headers.get('content-type') || 'application/octet-stream').split(';')[0];
    let name = String(f.fileName || 'lampiran').replace(/[^\w.\-]+/g, '_').slice(0, 80);
    if (!/\.[A-Za-z0-9]{2,5}$/.test(name)) name += extFor(contentType);
    const path = rid + '/' + (Number(f.index) + 1 || saved.length + 1) + '-' + name;
    const up = await fetch(c.url + '/storage/v1/object/' + BUCKET + '/' + path.split('/').map(encodeURIComponent).join('/'), {
      method: 'POST',
      headers: sbHeaders(c, { 'Content-Type': contentType, 'x-upsert': 'true' }),
      body: bytes,
    });
    if (!up.ok) throw new Error('Simpan lampiran ke Storage gagal: HTTP ' + up.status + ' ' + (await up.text()).slice(0, 200));
    saved.push({ index: saved.length, fileName: f.fileName || name, path, contentType, size: bytes.length });
  }
  if (saved.length) {
    const r = await fetch(c.url + '/rest/v1/erp_resi?resi_group_id=eq.' + encodeURIComponent(rid), {
      method: 'PATCH',
      headers: sbHeaders(c, { 'Content-Type': 'application/json', Prefer: 'return=minimal' }),
      body: JSON.stringify({ attachments: saved }),
    });
    if (!r.ok) throw new Error('Catat lampiran gagal: HTTP ' + r.status);
  }
  return saved;
}

function validate(p) {
  if (!p || p.event !== 'resi.created') return 'event bukan resi.created';
  if (!p.resi || typeof p.resi.resiGroupId !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(p.resi.resiGroupId)) return 'resi.resiGroupId tidak valid';
  if (!Array.isArray(p.kolis) || p.kolis.length === 0) return 'kolis kosong';
  for (const k of p.kolis) {
    if (!k || typeof k.koliId !== 'string' || !Array.isArray(k.items)) return 'koli tidak valid';
    for (const i of k.items) if (!i || !Number.isFinite(Number(i.qty))) return 'item tidak valid';
  }
  return null;
}

async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Gunakan POST.' });
  const c = cfg();
  if (!c.url || !c.key || !c.secret) return json(res, 503, { error: 'Integrasi ERP belum dikonfigurasi (env SUPABASE_URL, SUPABASE_SERVICE_KEY, ERP_WEBHOOK_SECRET).' });

  const raw = await rawBody(req);
  const timestamp = header(req, 'x-erp-timestamp');
  const signature = header(req, 'x-erp-signature').replace(/^sha256=/, '');
  const expected = crypto.createHmac('sha256', c.secret).update(timestamp + '.' + raw).digest('hex');
  const fresh = Math.abs(Date.now() / 1000 - Number(timestamp)) < 300;
  if (!fresh || !signature || !safeEqual(expected, signature)) return json(res, 401, { error: 'Tanda tangan tidak valid.' });

  let payload;
  try { payload = JSON.parse(raw); } catch (e) { return json(res, 400, { error: 'JSON tidak valid.' }); }
  const bad = validate(payload);
  if (bad) return json(res, 400, { error: bad });

  const rid = payload.resi.resiGroupId;
  try {
    await sbRpc(c, 'erp_receive_resi', { p: payload });
  } catch (e) {
    return json(res, 500, { error: String(e.message || e) });
  }
  try {
    const saved = await saveAttachments(c, rid, payload.attachments);
    return json(res, 200, { ok: true, resiGroupId: rid, kolis: payload.kolis.length, attachments: saved.length });
  } catch (e) {
    // Data resi SUDAH tersimpan; 502 membuat ERP mencoba ulang (aman karena idempoten) supaya lampiran ikut tersimpan.
    return json(res, 502, { ok: false, resiGroupId: rid, saved: true, error: String(e.message || e) });
  }
}

module.exports = handler;
module.exports.config = { api: { bodyParser: false } };
