/**
 * WOS Gudang (Inbound dan Outbound V2) - penyimpanan Google Sheets via Apps Script Web App
 * Tempel seluruh isi file ini di Apps Script milik spreadsheet "WOS Data Gudang".
 * Jalankan setup sekali, lalu Terapkan sebagai Aplikasi web (Saya / Siapa saja).
 */

// Kata sandi bersama antara WOS dan skrip ini. Boleh diganti, tetapi harus sama dengan yang dipakai di WOS.
const TOKEN = 'c0rssm2uBdoW2j4MDkPvKbkzeRKG';
const FOLDER_NAME = 'WOS-Gudang-Foto';          // folder Google Drive untuk foto unloading, GR, dan bukti outbound
const MAX_READ_ROWS = 4000;              // baris terakhir yang dibaca per permintaan

// Daftar tab dan judul kolom. Kolom pertama selalu "id" (kunci unik).
const TABS = {
  MASTER_VENDOR: ['id','kode','nama','pola_po','status','catatan','pks','email','alamat','telp'],
  MASTER_EKSPEDISI: ['id','nama','status','kontak','catatan'],
  MASTER_AREA: ['id','nama','status','catatan'],
  MASTER_HPP: ['id','vendor','status_hpp','catatan'],
  PO_INFO: ['id','vendor','total_koli','pekan','catatan','diperbarui'],
  UNLOADING_SESI: ['id','waktu_server','tanggal','ekspedisi','pic_kode','pic_nama','jam_mulai','jam_selesai','status','catatan'],
  UNLOADING_RESI: ['id','waktu_server','tanggal','sesi_id','resi','po','vendor','ekspedisi','koli_list','area_staging','pic_kode'],
  KOLI: ['id','waktu_server','tanggal','po','no_koli','resi','sesi_id','ekspedisi','status','keterangan','pic_kode','jam_wita','foto_id'],
  PO_DOK: ['id','vendor','sj_item','sj_koli','sj_qty','sj_waktu','sj_oleh','hpp_item','hpp_waktu','hpp_oleh','catatan'],
  SJ_ITEM: ['id','tanggal','po','no_koli','seq','item','qty','tipe','tgl_kirim','awb','eta','diunggah_oleh'],
  HPP_ITEM: ['id','tanggal','po','item','kategori','jenis','qty','cogs','diunggah_oleh'],
  GR_ASSIGN: ['id','tanggal','po','no_koli','operator','operator_nama','ditugaskan_oleh','task_id','status','mulai','selesai'],
  GR_COUNT: ['id','tanggal','po','no_koli','seq','item','qty_sj','qty_actual','selisih','status','keterangan','foto_id','operator','jam_wita'],
  PUTAWAY: ['id','tanggal','po','no_koli','seq','item','bin','qty','operator','jam_wita'],
  MASTER_BIN: ['id','zona','tipe_rak','no_rak','level','bin','status','catatan'],
  MASTER_MOKA: ['id','data','catatan'],
  STOK_BIN: ['id','waktu_server','tanggal','jenis','bin','sku','item','qty_masuk','qty_keluar','referensi','pic_kode','catatan'],
  SOQ: ['id','tanggal','outlet','batch','sku','qty','diunggah_oleh'],
  ASSIGNMENT: ['id','tanggal','outlet','batch','koli','picker','bin','status','waktu'],
  LOG: ['waktu','aksi','tab','id','pesan']
};



/* ============ PEMASANGAN (jalankan sekali) ============ */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(TABS).forEach(function (name) {
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    const headers = TABS[name];
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#b5532a').setFontColor('#ffffff');
    sh.getRange(1, 1, sh.getMaxRows(), headers.length).setNumberFormat('@');   // semua kolom teks agar tanggal tidak berubah format
    sh.setFrozenRows(1);
    sh.autoResizeColumns(1, headers.length);
  });
  ['UNLOADING', 'STAGING_IN', 'GR'].forEach(function (n) {   // tab lama yang sudah tidak dipakai
    const old = ss.getSheetByName(n);
    if (old && old.getLastRow() < 2 && ss.getSheets().length > 1) ss.deleteSheet(old);
  });
  const first = ss.getSheets()[0];
  if (first && first.getName().indexOf('Sheet') === 0 && ss.getSheets().length > 1) ss.deleteSheet(first);
  seedMaster_();
  folder_();
  log_('setup', '', '', 'Tab dan folder siap');
  notify_('Selesai. ' + Object.keys(TABS).length + ' tab dibuat dan folder "' + FOLDER_NAME + '" siap di Google Drive.');
}

/* ============ API ============ */
function doGet(e) {
  try {
    const p = e.parameter || {};
    if (p.token !== TOKEN) return json_({ ok: false, error: 'token salah' });
    if (p.action === 'ping') return json_({ ok: true, time: new Date().toISOString(), tabs: Object.keys(TABS) });
    if (p.action === 'list') return json_({ ok: true, rows: list_(p.tab, p.from, p.to) });
    if (p.action === 'stok') return json_({ ok: true, rows: stok_() });
    if (p.action === 'multi') return json_({ ok: true, data: multi_(p.q) });
    return json_({ ok: false, error: 'aksi tidak dikenal' });
  } catch (err) { return json_({ ok: false, error: String(err) }); }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.token !== TOKEN) return json_({ ok: false, error: 'token salah' });
    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      if (body.action === 'batch') {
        const results = (body.ops || []).map(function (op) { return runOp_(op); });
        return json_({ ok: true, results: results });
      }
      return json_(Object.assign({ ok: true }, runOp_(body)));
    } finally { lock.releaseLock(); }
  } catch (err) { return json_({ ok: false, error: String(err) }); }
}

function runOp_(op) {
  if (op.action === 'append') return upsert_(op.tab, op.row);
  if (op.action === 'delete') return remove_(op.tab, op.id);
  if (op.action === 'photo') return photo_(op);
  throw new Error('aksi tidak dikenal: ' + op.action);
}

/* ============ Baca / tulis baris ============ */
function sheet_(tab) {
  if (!TABS[tab]) throw new Error('tab tidak dikenal: ' + tab);
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(tab);
  if (!sh) throw new Error('tab belum dibuat, jalankan setup: ' + tab);
  return sh;
}

function list_(tab, from, to) {
  const sh = sheet_(tab), headers = TABS[tab], last = sh.getLastRow();
  if (last < 2) return [];
  const dateCol = headers.indexOf('tanggal');
  const out = [];
  const take = function (r) {
    if (dateCol >= 0 && (from || to)) {
      const d = r[dateCol];
      if ((from && d < from) || (to && d > to)) return;
    }
    const o = {};
    headers.forEach(function (h, i) { o[h] = r[i]; });
    if (o.id !== '') out.push(o);
  };
  if (dateCol < 0 || !from) {
    const start = Math.max(2, last - MAX_READ_ROWS + 1);
    sh.getRange(start, 1, last - start + 1, headers.length).getDisplayValues().forEach(take);
    return out;
  }
  // baca dari bawah per blok sampai bertemu data yang lebih lama dari "from" (jauh lebih cepat saat data menumpuk)
  const CH = 250;
  let end = last, scanned = 0;
  while (end >= 2 && scanned < MAX_READ_ROWS) {
    const start = Math.max(2, end - CH + 1);
    const vals = sh.getRange(start, 1, end - start + 1, headers.length).getDisplayValues();
    let allOld = true;
    for (let i = 0; i < vals.length; i++) { const d = vals[i][dateCol]; if (!d || d >= from) { allOld = false; break; } }
    vals.forEach(take);
    scanned += vals.length;
    if (allOld) break;
    end = start - 1;
  }
  return out;
}

/* Banyak tab sekaligus: q = "TAB:dari:sampai,TAB:dari:sampai" -> { "TAB|dari|sampai": [baris] } */
function multi_(q) {
  const res = {};
  String(q || '').split(',').forEach(function (part) {
    const p = part.split(':');
    if (!p[0] || !TABS[p[0]]) return;
    res[p[0] + '|' + (p[1] || '') + '|' + (p[2] || '')] = list_(p[0], p[1] || '', p[2] || '');
  });
  return res;
}

function upsert_(tab, row) {
  const sh = sheet_(tab), headers = TABS[tab];
  if (!row) throw new Error('baris kosong');
  if (headers.indexOf('waktu_server') >= 0 && !row.waktu_server) row.waktu_server = Utilities.formatDate(new Date(), 'Asia/Makassar', 'yyyy-MM-dd HH:mm:ss');
  const values = headers.map(function (h) { return row[h] === undefined || row[h] === null ? '' : String(row[h]); });
  const id = values[0];
  if (id) {
    const last = sh.getLastRow();
    if (last >= 2) {
      const ids = sh.getRange(2, 1, last - 1, 1).getValues();
      for (let i = ids.length - 1; i >= 0; i--) {
        if (String(ids[i][0]) === id) {
          sh.getRange(i + 2, 1, 1, headers.length).setValues([values]);
          afterWrite_(tab, row);
          return { saved: id, updated: true };
        }
      }
    }
  }
  sh.appendRow(values);
  afterWrite_(tab, row);
  return { saved: id, updated: false };
}

function remove_(tab, id) {
  const sh = sheet_(tab), last = sh.getLastRow();
  if (last < 2) return { removed: false };
  const ids = sh.getRange(2, 1, last - 1, 1).getValues();
  for (let i = ids.length - 1; i >= 0; i--) {
    if (String(ids[i][0]) === String(id)) { sh.deleteRow(i + 2); return { removed: true }; }
  }
  return { removed: false };
}

/* ============ Foto / bukti ke Google Drive ============ */
function folder_() {
  const it = DriveApp.getFoldersByName(FOLDER_NAME);
  return it.hasNext() ? it.next() : DriveApp.createFolder(FOLDER_NAME);
}

function photo_(op) {
  if (!op.data) throw new Error('data foto kosong');
  const bytes = Utilities.base64Decode(op.data);
  const blob = Utilities.newBlob(bytes, op.mime || 'image/jpeg', op.name || ('foto-' + Date.now() + '.jpg'));
  const file = folderFor_(op.kategori, op.date).createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return { file_id: file.getId(), url: 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w600' };
}

/* Susunan folder: WOS-Foto / Kategori (Presensi, 5R, Pengajuan) / yyyy-MM / Pekan NN (tgl-tgl Bln) / yyyy-MM-dd */
const BULAN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
function sub_(parent, name) {
  const it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}
function weekLabel_(d) {
  const y = +d.slice(0, 4), m = +d.slice(5, 7), day = +d.slice(8, 10);
  const dow = new Date(Date.UTC(y, m - 1, day)).getUTCDay();
  const mon = new Date(Date.UTC(y, m - 1, day - ((dow + 6) % 7)));
  const sun = new Date(mon.getTime() + 6 * 864e5);
  const th = new Date(mon.getTime() + 3 * 864e5);
  const jan4 = new Date(Date.UTC(th.getUTCFullYear(), 0, 4));
  const wk = 1 + Math.round(((th - jan4) / 864e5 - 3 + ((jan4.getUTCDay() + 6) % 7)) / 7);
  const p2 = function (n) { return (n < 10 ? '0' : '') + n; };
  const a = p2(mon.getUTCDate()) + (mon.getUTCMonth() !== sun.getUTCMonth() ? ' ' + BULAN[mon.getUTCMonth()] : '');
  return 'Pekan ' + p2(wk) + ' (' + a + '-' + p2(sun.getUTCDate()) + ' ' + BULAN[sun.getUTCMonth()] + ')';
}
const _folderCache = {};
function folderFor_(kategori, date) {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(date || '') ? date : Utilities.formatDate(new Date(), 'Asia/Makassar', 'yyyy-MM-dd');
  const key = (kategori || 'Lainnya') + '|' + d;
  if (_folderCache[key]) return _folderCache[key];
  let f = folder_();
  [kategori || 'Lainnya', d.slice(0, 7), weekLabel_(d), d].forEach(function (n) { f = sub_(f, n); });
  _folderCache[key] = f;
  return f;
}

/* Jalankan manual untuk merapikan file lama di folder WOS-Foto.
   Aman dijalankan berulang: memproses sebagian per jalan (batas waktu ~4 menit), lanjutkan sampai sisa 0. */
function rapikanFolder() {
  const start = Date.now(), MAX_MS = 240000, MAX_FILES = 60;
  const root = folder_(), it = root.getFiles();
  let moved = 0, skipped = 0, left = 0;
  while (it.hasNext()) {
    const f = it.next(), name = f.getName();
    if (/^TEST/i.test(name)) { skipped++; continue; }
    if (moved >= MAX_FILES || Date.now() - start > MAX_MS) { left++; continue; }
    const m = /(\d{4}-\d{2}-\d{2})/.exec(name);
    const date = m ? m[1] : Utilities.formatDate(f.getDateCreated(), 'Asia/Makassar', 'yyyy-MM-dd');
    const kat = /^5R-/.test(name) ? '5R' : (/^P[0-9a-z]+\.jpg$/.test(name) ? 'Pengajuan' : 'Presensi');
    f.moveTo(folderFor_(kat, date));
    moved++;
  }
  notify_('Dirapikan: ' + moved + ' file. Sisa: ' + left + (left ? ' (jalankan rapikanFolder lagi sampai sisa 0)' : ' (selesai)') + '. Dilewati (TEST): ' + skipped + '.');
}

/* ============ Bantu ============ */

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function log_(aksi, tab, id, pesan) {
  try {
    const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('LOG');
    if (sh) sh.appendRow([Utilities.formatDate(new Date(), 'Asia/Makassar', 'yyyy-MM-dd HH:mm:ss'), aksi, tab, id, pesan]);
  } catch (e) {}
}

/* Tampilkan pesan: dialog bila spreadsheet terbuka, jika tidak ditulis ke Execution log */
function notify_(msg) {
  Logger.log(msg);
  try { SpreadsheetApp.getActiveSpreadsheet().toast(String(msg), "WOS", 8); } catch (e) {}
}

/* ============ Data awal master (hanya diisi bila masih kosong) ============ */
function afterWrite_(tab, row) { /* tidak ada aturan otomatis di sisi server untuk saat ini */ }

function seedMaster_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sv = ss.getSheetByName('MASTER_VENDOR');
  if (sv && sv.getLastRow() < 2) {
    const A = 'Aktif', T = 'Tidak aktif', cek = 'Status perlu dicek';
    [
      ['INDRA-01', '1', 'INDRA-01', '', T, ''], ['INDRA-02', '1', 'INDRA-02', '', T, ''], ['INDRA-03', '1', 'INDRA-03', '', T, ''],
      ['YOGI-01', '2', 'YOGI-01', '02-GI-01', A, 'Konveksi 1'], ['YOGI-02', '2', 'YOGI-02', '02-GI-02', A, 'Konveksi 2'],
      ['YOGA', '3', 'YOGA', '', T, ''], ['BAYU', '4', 'BAYU', 'BY', A, ''],
      ['KONVEKSI MKS', '00', 'KONVEKSI MKS', '', A, cek], ['CECEP', '5', 'CECEP', '', A, cek], ['KOKO', '6', 'KOKO', '', A, cek],
      ['TEDI', '7', 'TEDI', '', A, cek], ['YADI', '8', 'YADI', '', A, cek], ['DEDI', '9', 'DEDI', '', A, cek],
      ['ELANG', '10', 'ELANG', '', A, cek], ['AWAL', '11', 'AWAL', '', A, cek], ['DIDI', '12', 'DIDI', '', A, cek],
      ['CUSTOM PROJECT', '13', 'CUSTOM PROJECT', '', A, cek], ['ARTA', '14', 'ARTA', '', A, cek], ['MALIBU', '15', 'MALIBU', '', A, cek]
    ].forEach(function (r) { sv.appendRow(r); });
  }
  const se = ss.getSheetByName('MASTER_EKSPEDISI');
  if (se && se.getLastRow() < 2) {
    se.appendRow(['WUS', 'WUS', 'Aktif', '', '']);
    se.appendRow(['CAS', 'CAS', 'Aktif', '', '']);
  }
}

/* Saldo stok per bin dan SKU = jumlah mutasi masuk dikurangi keluar (membaca seluruh riwayat STOK_BIN) */
function stok_() {
  const sh = sheet_('STOK_BIN'), H = TABS.STOK_BIN, last = sh.getLastRow();
  if (last < 2) return [];
  const v = sh.getRange(2, 1, last - 1, H.length).getValues();
  const iB = H.indexOf('bin'), iS = H.indexOf('sku'), iI = H.indexOf('item'), iM = H.indexOf('qty_masuk'), iK = H.indexOf('qty_keluar');
  const m = {};
  v.forEach(function (r) {
    const bin = String(r[iB] || '').trim(), sku = String(r[iS] || '').trim();
    if (!bin && !sku) return;
    const k = bin + '|' + sku;
    const o = m[k] || (m[k] = { bin: bin, sku: sku, item: '', masuk: 0, keluar: 0 });
    if (!o.item && r[iI]) o.item = String(r[iI]);
    o.masuk += Number(r[iM]) || 0;
    o.keluar += Number(r[iK]) || 0;
  });
  return Object.keys(m).map(function (k) { const o = m[k]; o.saldo = o.masuk - o.keluar; return o; });
}
