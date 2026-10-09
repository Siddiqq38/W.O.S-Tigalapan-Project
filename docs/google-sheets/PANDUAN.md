# Panduan Menyambungkan WOS ke Google Sheets (untuk pemula)

Waktu: sekitar 10 menit. Lakukan dengan akun Google yang akan menjadi pemilik data WOS.

1. Buka https://sheets.google.com lalu klik **Kosong (Blank)**. Ubah nama file menjadi **WOS Data Operasional**.
2. Di menu atas klik **Ekstensi > Apps Script**. Tab baru terbuka.
3. Di editor, hapus semua tulisan di dalam file `Code.gs`. Buka file `WOS-Apps-Script.txt` (folder Documents), salin semua isinya, tempel ke editor. Klik ikon disket (Simpan).
4. Pada daftar fungsi di atas editor pilih **setup**, lalu klik **Jalankan**.
5. Muncul "Perlu otorisasi". Klik **Tinjau izin**, pilih akun Anda, klik **Lanjutan (Advanced)**, lalu **Buka WOS (tidak aman)**, lalu **Izinkan**. Ini normal karena skrip dibuat sendiri.
6. Setelah selesai, kembali ke tab spreadsheet: ada 10 tab baru (ATTENDANCE, ROLE_HARIAN, dst). Folder **WOS-Foto** juga muncul di Google Drive.
7. Kembali ke Apps Script, klik **Terapkan (Deploy) > Deployment baru**. Klik ikon roda gigi, pilih **Aplikasi web**.
   - Jalankan sebagai: **Saya**
   - Yang memiliki akses: **Siapa saja**
   Klik **Terapkan**, lalu **Izinkan akses** bila diminta.
8. Salin **URL aplikasi web** (berakhiran `/exec`) dan kirim ke pengelola WOS. Jangan bagikan ke staf.

Bila kode skrip diubah di kemudian hari: Terapkan > Kelola deployment > ikon pensil > Versi baru > Terapkan (URL tetap sama).
