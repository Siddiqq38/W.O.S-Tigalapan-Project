// Kirim satu resi UJI (bertanda tangan seperti ERP) ke endpoint WOS, untuk mengetes tanpa menunggu ERP.
// Pakai:  node docs/erp-integrasi/kirim-uji.mjs https://<alamat-wos>/api/erp-resi <ERP_WEBHOOK_SECRET>
// Hasil yang benar: HTTP 200 {"ok":true,...}. Jalankan dua kali: data tidak dobel (idempoten).
import { createHmac } from 'node:crypto';

const [url, secret] = process.argv.slice(2);
if (!url || !secret) {
  console.error('Pemakaian: node kirim-uji.mjs <url endpoint> <ERP_WEBHOOK_SECRET>');
  process.exit(1);
}

const payload = {
  event: 'resi.created',
  eventId: 'RESI-UJI-001',
  sentAt: new Date().toISOString(),
  resi: {
    resiGroupId: 'RESI-UJI-001',
    resiNo: 'AWB-UJI-001',
    expedition: 'EKSPEDISI UJI',
    note: 'data uji, boleh dihapus',
    shippingDate: new Date().toISOString().slice(0, 10),
    totalKoli: 1,
    totalQty: 30,
    mrpNumbers: ['W-UJI'],
    vendor: { id: 'uji', name: 'VENDOR UJI' },
  },
  kolis: [
    {
      koliId: 'KOLI-UJI-1',
      koliNo: '0001',
      mrpNo: 'W-UJI',
      weightKg: 12.5,
      items: [
        { color: 'JET BLACK 24S', sleeve: 'PENDEK', size: 'M', sku: 'B01-UJI-M', qty: 20, kind: 'FG', age: null },
        { color: 'JET BLACK 24S', sleeve: 'PENDEK', size: 'L', sku: 'B01-UJI-L', qty: 10, kind: 'FG', age: null },
      ],
    },
  ],
};

const body = JSON.stringify(payload);
const timestamp = String(Math.floor(Date.now() / 1000));
const signature = 'sha256=' + createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
const res = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-ERP-Event': 'resi.created', 'X-ERP-Timestamp': timestamp, 'X-ERP-Signature': signature, 'Idempotency-Key': payload.eventId },
  body,
});
console.log('HTTP', res.status, await res.text());
