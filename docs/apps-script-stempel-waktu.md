# Stempel waktu otomatis di spreadsheet (jam asli VP dan ACT)

Spreadsheet tidak menyimpan jam saat kotak dicentang. Skrip kecil ini menuliskannya ke dua kolom tambahan,
dan aplikasi W.O.S otomatis memakainya (menggantikan jam "terbaca di browser") bila kolomnya ada.
Tidak butuh Supabase.

## Yang dipakai aplikasi
- Kolom **JAM VP**: terisi saat kotak VP (atau FV) dicentang, kosong lagi bila centang dibatalkan.
- Kolom **JAM ACT**: terisi saat kolom *ACT Picking* diisi, kosong lagi bila dikosongkan.
- Format: `yyyy-MM-dd HH:mm:ss` (WITA). Format `dd/MM/yyyy HH:mm:ss` juga terbaca.
- Bila kolomnya belum ada, aplikasi tetap jalan seperti biasa (memakai jam terbaca di browser).

Dengan jam asli:
- Jam selesai VP per koli akurat, sehingga koli berikutnya mulai tepat 1 menit sesudahnya.
- Jam mulai dan selesai picker, lead time, dan persentase "rencana vs aktual" menjadi akurat.

## Cara memasang
1. Di setiap tab outlet (UPG-01, PLW-01, dst.) tambahkan dua kolom dengan judul persis **JAM VP** dan **JAM ACT** (boleh disembunyikan).
2. Buka **Extensions → Apps Script**, hapus isi bawaan, tempel skrip di bawah, lalu simpan.
3. Jalankan sekali fungsi `onEdit` bila diminta izin, atau cukup edit satu sel: trigger sederhana `onEdit` aktif otomatis.
4. Lindungi kolom JAM VP dan JAM ACT (Data → Protect sheets and ranges) agar tidak diubah manual.
5. Pastikan tab outlet tetap dipublikasikan seperti sekarang.

## Skrip
```javascript
const TZ = 'Asia/Makassar';

function onEdit(e) {
  const sh = e.range.getSheet();
  if (!/^[A-Z]{3}-\d{2}$/.test(sh.getName())) return;           // hanya tab outlet: UPG-01, LLO-01, ...

  const head = findHeader_(sh);
  if (!head) return;
  const col = e.range.getColumn();
  const name = head.names[col - 1];
  const target = (name === 'VP' || name === 'FV') ? 'JAMVP' : (name === 'ACTPICKING' ? 'JAMACT' : null);
  if (!target) return;
  const tcol = head.names.indexOf(target) + 1;
  if (tcol < 1) return;                                          // kolom JAM VP / JAM ACT belum dibuat

  const ts = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm:ss');
  for (let i = 0; i < e.range.getNumRows(); i++) {
    const row = e.range.getRow() + i;
    if (row <= head.row) continue;                               // lewati baris judul
    const v = e.range.getCell(i + 1, 1).getValue();
    const on = (target === 'JAMVP') ? v === true : v !== '' && v !== null;
    const cell = sh.getRange(row, tcol);
    if (on && cell.getValue() === '') cell.setValue(ts);         // jangan menimpa jam pertama
    if (!on) cell.clearContent();
  }
}

function findHeader_(sh) {
  const top = sh.getRange(1, 1, Math.min(6, sh.getLastRow()), sh.getLastColumn()).getValues();
  for (let r = 0; r < top.length; r++) {
    const names = top[r].map(h => String(h).toUpperCase().replace(/[^A-Z0-9]/g, ''));
    if (names.includes('VP') || names.includes('FV')) return { row: r + 1, names };
  }
  return null;
}
```

## Catatan
- Trigger `onEdit` hanya berjalan untuk perubahan yang dilakukan orang di spreadsheet (termasuk aplikasi Sheets di HP), bukan untuk perubahan lewat skrip atau impor.
- Jam yang dicatat adalah jam server Google saat sel diubah, jadi tidak tergantung jam perangkat.
- Jika VP dicentang untuk beberapa baris sekaligus (seret), semua baris mendapat jam yang sama.
