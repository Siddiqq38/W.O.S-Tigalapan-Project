// Pembantu bersama untuk integrasi ERP Tigalapan -> WOS (awalan "_" = bukan rute Vercel).
const crypto = require('crypto');

// Ambil hanya alamat dasar proyek (https://xxxx.supabase.co); jalur tambahan seperti /rest/v1 yang terlanjur terisi dibuang.
function baseUrl(v) {
  const s = String(v || '').trim().replace(/^["']|["']$/g, '');
  try { return new URL(s).origin; } catch (e) { return s.replace(/\/+$/, ''); }
}

function cfg() {
  return {
    url: baseUrl(process.env.SUPABASE_URL),
    key: process.env.SUPABASE_SERVICE_KEY || '',
    secret: process.env.ERP_WEBHOOK_SECRET || '',
    viewPassword: process.env.ERP_VIEW_PASSWORD || '',
    erpBase: (process.env.ERP_BASE_URL || '').replace(/\/+$/, ''),
    gudangUrl: (process.env.GUDANG_URL || '').trim().replace(/^["']|["']$/g, ''),
    gudangToken: process.env.GUDANG_TOKEN || '',
  };
}

const sleeveCode = (s) => {
  const t = String(s || '').trim().toUpperCase();
  return t === 'PENDEK' ? 'PDK' : t === 'PANJANG' ? 'PJG' : t;
};

// Nama item gaya WOS: "<warna> <PDK|PJG> <size>", mis. "BENHUR SPECIAL 24S PDK M".
function itemName(i) {
  return [String(i.color || '').trim().toUpperCase(), sleeveCode(i.sleeve), String(i.size || '').trim().toUpperCase()].filter(Boolean).join(' ');
}

// Nomor resi: buang awalan "AWB" (AWB12345 / AWB 12345 / AWB-12345 -> 12345). Sama dengan resiClean di index.html.
function resiClean(s) {
  return String(s == null ? '' : s).replace(/^\s*AWB[\s\-:.#]*/i, '').trim();
}

// Ubah kiriman ERP menjadi baris tab ERP_INCOMING (satu baris = satu koli x satu MRP). Item dikelompokkan per MRP:
// MRP diambil dari item (mrpNo), kalau tidak ada dari koli, kalau tidak ada dari resi. Dengan begitu satu karung berisi dua MRP
// menjadi dua baris dengan nomor koli yang sama, dan di WOS masing-masing masuk ke PO-nya sendiri.
function toSheetRows(p) {
  const r = p.resi || {};
  const rid = r.resiGroupId;
  const date = String(r.shippingDate || '').slice(0, 10) || new Date().toISOString().slice(0, 10);
  const dflt = (Array.isArray(r.mrpNumbers) && r.mrpNumbers[0]) || '';
  const out = [];
  (p.kolis || []).forEach((k) => {
    const by = {};
    (k.items || []).forEach((i) => {
      const mrp = String(i.mrpNo || k.mrpNo || dflt || '').trim();
      const hpp = Number(i.hpp != null ? i.hpp : i.unitCost != null ? i.unitCost : i.cogs);
      (by[mrp] = by[mrp] || []).push({
        n: itemName(i), q: Number(i.qty) || 0, h: Number.isFinite(hpp) && hpp > 0 ? hpp : 0,
        e: i.hppEstimated || i.estimated ? 1 : 0, k: String(i.kind || 'FG').toUpperCase(), s: i.sku || '',
      });
    });
    Object.keys(by).forEach((mrp) => {
      const its = by[mrp];
      const n = parseInt(String(k.koliNo || '').replace(/\D/g, ''), 10);
      out.push({
        id: rid + '|' + k.koliId + '|' + mrp,
        tanggal: date,
        resi_group: rid,
        resi: resiClean(r.resiNo || rid),
        ekspedisi: r.expedition || '',
        vendor: (r.vendor && r.vendor.name) || '',
        mrp,
        no_koli: Number.isFinite(n) && n > 0 ? String(n) : String(k.koliNo || ''),
        koli_erp: String(k.koliNo || ''),
        items: JSON.stringify(its),
        qty: String(its.reduce((a, x) => a + x.q, 0)),
        hpp_total: String(Math.round(its.reduce((a, x) => a + x.q * x.h, 0))),
        catatan: r.note || '',
      });
    });
  });
  return out;
}

// Kirim baris ke skrip Google gudang (batch append, idempoten: id yang sama diperbarui, bukan digandakan).
async function pushToSheet(c, rows) {
  if (!rows.length) return 0;
  const CH = 150;
  for (let i = 0; i < rows.length; i += CH) {
    const r = await fetch(c.gudangUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ token: c.gudangToken, action: 'batch', ops: rows.slice(i, i + CH).map((row) => ({ action: 'append', tab: 'ERP_INCOMING', row })) }),
      redirect: 'follow',
    });
    const t = await r.text();
    let j; try { j = JSON.parse(t); } catch (e) { throw new Error('Skrip gudang membalas bukan JSON (HTTP ' + r.status + ')'); }
    if (!j.ok) throw new Error('Skrip gudang menolak: ' + (j.error || 'tanpa pesan'));
  }
  return rows.length;
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

module.exports = { cfg, safeEqual, sbHeaders, sbRpc, json, toSheetRows, pushToSheet, itemName };
