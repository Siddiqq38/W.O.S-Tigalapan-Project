// GET /api/erp-resi-list?from=YYYY-MM-DD&to=YYYY-MM-DD&q=teks -- daftar resi dari ERP untuk halaman erp-resi.html.
// Dilindungi kata sandi (header x-view-password = env ERP_VIEW_PASSWORD). Lampiran dikembalikan sebagai tautan sementara (1 jam).
const { cfg, safeEqual, sbHeaders, json } = require('./_erp');

const BUCKET = 'erp-resi-files';

async function signedUrl(c, path) {
  const r = await fetch(c.url + '/storage/v1/object/sign/' + BUCKET + '/' + path.split('/').map(encodeURIComponent).join('/'), {
    method: 'POST',
    headers: sbHeaders(c, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ expiresIn: 3600 }),
  });
  if (!r.ok) return null;
  const d = await r.json();
  return d.signedURL ? c.url + '/storage/v1' + d.signedURL : null;
}

async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Gunakan GET.' });
  const c = cfg();
  if (!c.url || !c.key || !c.viewPassword) return json(res, 503, { error: 'Belum dikonfigurasi (env SUPABASE_URL, SUPABASE_SERVICE_KEY, ERP_VIEW_PASSWORD).' });
  const given = req.headers['x-view-password'];
  if (!given || !safeEqual(Array.isArray(given) ? given[0] : given, c.viewPassword)) return json(res, 401, { error: 'Kata sandi salah.' });

  const q = new URL(req.url, 'http://x').searchParams;
  const params = new URLSearchParams({ select: '*,erp_resi_koli(*,erp_resi_item(*))', order: 'received_at.desc', limit: '200' });
  const from = q.get('from');
  const to = q.get('to');
  if (/^\d{4}-\d{2}-\d{2}$/.test(from || '')) params.append('shipping_date', 'gte.' + from);
  if (/^\d{4}-\d{2}-\d{2}$/.test(to || '')) params.append('shipping_date', 'lte.' + to);
  const text = (q.get('q') || '').replace(/[^\w .\-]/g, '').trim();
  if (text) params.append('or', '(resi_no.ilike.*' + text + '*,vendor_name.ilike.*' + text + '*,resi_group_id.ilike.*' + text + '*)');

  const r = await fetch(c.url + '/rest/v1/erp_resi?' + params.toString(), { headers: sbHeaders(c) });
  if (!r.ok) return json(res, 500, { error: 'Gagal membaca data: HTTP ' + r.status + ' ' + (await r.text()).slice(0, 300) });
  const rows = await r.json();
  for (const row of rows) {
    delete row.raw;
    row.attachments = await Promise.all((row.attachments || []).map(async (a) => Object.assign({}, a, { url: await signedUrl(c, a.path) })));
  }
  return json(res, 200, { count: rows.length, rows });
}

module.exports = handler;
