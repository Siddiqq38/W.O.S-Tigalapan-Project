# Naskah storyboard WOS

Setiap frame adalah satu gambar 1920×1080. Durasi saran dihitung dari panjang narasi (sekitar 14 karakter per detik, ditambah 3 detik jeda).

## Alur 1 · Operasional harian

### A01 · Masuk ke WOS
*Peran: Semua staf · saran 13 detik · file `frames/A01.png`*

Buka alamat WOS di browser HP atau laptop. Isi Kode Staff, lalu password awal (sama dengan ID Staff). Ganti password setelah masuk pertama kali.

### A02 · Presensi masuk: pilih nama dan aksi
*Peran: Operator · saran 11 detik · file `frames/A02.png`*

Buka menu Attendance. Pilih Kode Staff Anda dan aksi “Attendance in”. Jam masuk 08.00 WITA, terlambat dihitung setelah 08.10.

### A03 · Ambil foto dan validasi lokasi
*Peran: Operator · saran 12 detik · file `frames/A03.png`*

Foto kamera wajib (tanpa galeri). Lokasi harus berada dalam radius 25 meter dari DC 38. Nyalakan GPS dan izinkan lokasi di browser.

### A04 · Konfirmasi presensi
*Peran: Operator · saran 13 detik · file `frames/A04.png`*

Setelah foto dan lokasi valid, tekan “Konfirmasi presensi”. Kamera menutup otomatis. Salah foto? Minta SPV membatalkan presensi agar bisa mengulang.

### A05 · Izin dan pengajuan
*Peran: Operator · saran 13 detik · file `frames/A05.png`*

Terlambat, sakit, atau perlu izin? Ajukan lewat kartu “Pengajuan dan persetujuan” beserta bukti foto. Pengajuan masuk ke antrean approval SPV.

### A06 · DRM: centang semua yang ikut briefing
*Peran: SPV · saran 15 detik · file `frames/A06.png`*

Setelah briefing pagi, SPV membuka Alokasi role harian. Tekan “Centang semua”, lalu silang (✕) hanya staf yang tidak ikut. Yang disilang otomatis tercatat di Compliance.

### A07 · Bagikan role per rentang jam
*Peran: SPV · saran 15 detik · file `frames/A07.png`*

Pilih role, jam mulai, dan jam selesai untuk tiap staf, lalu “Tambah”. Satu staf boleh punya beberapa role di jam berbeda. Staf yang sudah hadir bisa memilih role sendiri.

### A08 · Laporan 5R harian
*Peran: Operator · saran 14 detik · file `frames/A08.png`*

Mulai pukul 15.45 WITA, buka Compliance dan pilih area. Rekam video (disarankan) atau ambil foto area kerja. Kirim sebelum 18.00 WITA supaya tidak tercatat terlambat.

### A09 · Approval 5R per rentang tanggal
*Peran: SPV · saran 17 detik · file `frames/A09.png`*

Antrean approval menampilkan kiriman yang menunggu. Pilih rentang tanggal yang sedang berjalan (Hari ini, Kemarin–hari ini, 7 hari). Klik Periksa lalu ACC penuh, ACC sebagian, atau Tolak dengan alasan.

### A10 · Hasil approval masuk ke Task operator
*Peran: Operator · saran 14 detik · file `frames/A10.png`*

Hasil ACC, ACC sebagian, atau Tolak dikirim sebagai tugas baru ke akun operator, lengkap dengan alasan dan R yang belum memenuhi. Operator membaca dan memperbaikinya.

### A11 · Task harian: terima dan selesaikan
*Peran: Operator · saran 14 detik · file `frames/A11.png`*

Semua pekerjaan (picking, GR, verifikasi, opname) datang sebagai task. Terima task, kerjakan di menu terkait, dan task otomatis selesai saat pekerjaannya selesai.

### A12 · Evaluasi rekan kerja dengan rekaman
*Peran: SPV / HRD · saran 18 detik · file `frames/A12.png`*

Pilih karyawan dan pewawancara, lalu mulai rekam. Isi kelebihan dan hal yang perlu diperbaiki, beri nilai K/S/B. Satu rekaman per rekan, bisa ditambah dan dihapus. Hasil dicetak dengan tempat, tanggal, dan nama pewawancara.

### A13 · Performance tim bulanan
*Peran: SPV / Manager / HRD · saran 16 detik · file `frames/A13.png`*

Peringkat dihitung dari kehadiran, produktivitas task, dan compliance (potong tanggal 23–22). Skor akhir = 70% produktivitas + 30% compliance. Klik Detail untuk melihat task dan pelanggarannya.

## Alur 2 · Inbound dan stok

### B01 · Mulai unloading
*Peran: Admin Inbound · saran 19 detik · file `frames/B01.png`*

Ekspedisi datang? Buka Inbound > Unloading. Pilih ekspedisi, operator penerima, tanggal terima, dan jam mulai, lalu “Mulai unloading”. Untuk data in-transit lama, isi tanggal terima yang sebenarnya agar umur stok terbaca benar.

### B02 · Sesi unloading terbaru
*Peran: Admin / Operator · saran 13 detik · file `frames/B02.png`*

Semua sesi tercatat dengan ekspedisi, operator, dan statusnya. “Lanjutkan” untuk sesi yang sedang berjalan, “Lihat” untuk yang sudah selesai.

### B03 · Catat STTB dan centang koli satu per satu
*Peran: Operator · saran 17 detik · file `frames/B03.png`*

Isi nomor STTB/resi dan PO, lalu ketuk setiap koli yang diturunkan. Koli yang rusak atau basah ditandai bermasalah beserta fotonya. Setelah semua masuk, lanjut ke validasi dan cetak tanda terima barang.

### B04 · Incoming: kiriman yang belum datang
*Peran: Admin Inbound · saran 17 detik · file `frames/B04.png`*

Koli PO yang belum tiba tampil sebagai Incoming (on delivery), lengkap dengan umur sejak unload terakhir. Saat kiriman lanjutan tiba, ketuk Terima untuk membuat sesi unloading berikutnya dengan STTB yang sama.

### B05 · Staging In: siap GR atau menunggu dokumen
*Peran: Admin Inbound · saran 16 detik · file `frames/B05.png`*

Koli yang sudah tervalidasi masuk Staging In per PO. Import Surat Jalan (SJ) dan HPP dari Excel. PO berstatus Ready GR setelah SJ dan HPP lengkap, dan umur di staging dihitung otomatis.

### B06 · Tracking koli dan item
*Peran: Semua staf inbound · saran 13 detik · file `frames/B06.png`*

Ketik awal kode PO, misalnya BY40, untuk melihat seluruh koli PO. Tambahkan nomor koli atau nama item untuk melihat jumlah, status, dan lokasi put away.

### B07 · Good Receipt: bagi tugas counting
*Peran: Admin Inbound · saran 13 detik · file `frames/B07.png`*

Di Good Receipt, admin menugaskan koli ke operator. Urutan operator mengikuti yang sedang stand by. Setiap penugasan menjadi task di akun operator.

### B08 · Counting: hitung actual per item
*Peran: Operator · saran 15 detik · file `frames/B08.png`*

Buka koli yang ditugaskan, isi qty actual untuk setiap item. Selisih terhadap Surat Jalan otomatis terhitung. Item reject tidak ikut put away dan diteruskan ke Defect Handling.

### B09 · Put Away: simpan ke bin
*Peran: Operator · saran 16 detik · file `frames/B09.png`*

Isi bin tujuan untuk tiap item. Satu item boleh dipecah ke beberapa bin, jumlahnya harus sama dengan qty actual. Bin yang sedang dikunci tidak bisa dipakai. Setelah disimpan, stok bin bertambah.

### B10 · Data Entry PO ke MOKA
*Peran: Admin Inbound · saran 13 detik · file `frames/B10.png`*

Admin menyalin item dan qty PO ke MOKA satu per satu. Setelah selesai, tandai agar tidak dikerjakan dua kali. Rekap data entry tampil di Analysis.

### B11 · Location Control: layout gudang
*Peran: SPV / Admin · saran 15 detik · file `frames/B11.png`*

Denah gudang menampilkan semua bin. Warna menunjukkan bin terisi dan bin kosong; klik bin untuk melihat isi, pallet 3D, dan kapasitasnya. Bin yang sedang dihitung otomatis terkunci.

### B12 · Stok Opname dan Cycle Count
*Peran: SPV / Admin · saran 15 detik · file `frames/B12.png`*

Buat task hitung untuk operator: stok opname semester (bin berurutan) atau cycle count bin tertentu. Hasil hitung dibandingkan dengan sistem. Selisih besar naik sebagai CRITICAL.

### B13 · Internal Move dan Adjustment
*Peran: Admin / Operator · saran 13 detik · file `frames/B13.png`*

Pindah barang antar bin lewat Internal Move (bin asal, bin tujuan, qty). Selisih stok yang sudah dipastikan dikoreksi lewat Adjustment dan disetujui SPV.

### B14 · Inventory: rincian stok per kategori
*Peran: Semua · saran 16 detik · file `frames/B14.png`*

Inventory menampilkan total stok, bin terisi, dan SKU, lengkap dengan rincian per kategori: Tigalapan, MAMU, MYNO, Item Support, dan Defect. Gunakan kotak cari untuk bin, SKU, atau nama item.

## Alur 3 · Outbound

### C01 · Upload SOQ dan daftar dokumen
*Peran: Admin Outbound · saran 16 detik · file `frames/C01.png`*

Buka Outbound > Picking List dan upload file Excel SOQ (nama file memuat kode shipment, outlet, dan tanggal). Sistem membaca item, mengelompokkan ke koli, dan admin menentukan picker.

### C02 · Koli, picker, dan progres per SOQ
*Peran: Admin Outbound · saran 14 detik · file `frames/C02.png`*

Setiap SOQ menampilkan jumlah item, total pcs, dan status tiap koli: siapa pickernya dan sampai tahap mana. Picker bisa direvisi selama koli belum mulai dikerjakan.

### C03 · Picking: ambil barang sesuai bin
*Peran: Picker · saran 19 detik · file `frames/C03.png`*

Picker membuka koli miliknya. Setiap baris memuat bin, item, dan qty yang harus diambil. Ketuk ✓ bila sesuai atau ✗ bila selisih. Kekurangan bisa dilengkapi dari bin lain. Selesai semua item, tekan “Selesai picking koli ini”.

### C04 · Verification Pick oleh orang lain
*Peran: Checker · saran 16 detik · file `frames/C04.png`*

Checker (bukan picker koli itu) memeriksa tiap item yang sudah diambil: Sesuai atau Salah dengan alasan. Item salah dikembalikan ke picker untuk dikoreksi, lalu koli lolos ke tahap TFS.

### C05 · TFS ke MOKA
*Peran: Admin Outbound · saran 18 detik · file `frames/C05.png`*

Admin outbound menyalin item dan qty tiap koli ke Transfer Stok MOKA, lalu centang “sudah selesai TFS”. Barang tambahan seperti surat jalan dicatat di Other (bisa diubah dan dihapus). Operator lain hanya bisa melihat.

### C06 · Packing dan Staging
*Peran: Packer · saran 13 detik · file `frames/C06.png`*

Koli yang selesai TFS dipacking. Pilih area staging (Out City atau In City), tandai koli yang selesai dipacking, lalu cetak surat jalan dan STTB.

### C07 · Loading ke kendaraan
*Peran: Admin Outbound / Driver · saran 11 detik · file `frames/C07.png`*

Koli di staging dimuat ke kendaraan. Tandai koli yang sudah dimuat per tujuan sehingga tidak ada koli tertinggal.

### C08 · Shipping: koli menuju outlet
*Peran: Driver / Admin · saran 13 detik · file `frames/C08.png`*

Koli berstatus Shipping dikirim ke outlet. Driver mencatat odometer di menu Perjalanan dan rute terisi otomatis dari koli yang sedang Shipping.

### C09 · Receiving Outlet
*Peran: Store Head · saran 12 detik · file `frames/C09.png`*

Di outlet, Store Head membuka Receiving Outlet dan menandai koli yang diterima. Bila ada koli rusak atau kurang, tulis keterangannya.

### C10 · GR Outlet: cek isi koli
*Peran: Store Head · saran 14 detik · file `frames/C10.png`*

Store Head mencocokkan isi koli dengan SOQ item per item. Bila ada yang kurang atau salah, catat dan unggah video bukti. Temuan ini masuk ke Miss-Picking.

### C11 · Miss-Picking: tindak lanjut temuan
*Peran: SPV / Admin · saran 16 detik · file `frames/C11.png`*

Temuan dari toko tampil di Miss-Picking beserta koli, item, dan selisihnya. SPV menuntaskan dengan resolusi. Temuan dihitung sebagai poin pelanggaran untuk picker, checker, dan packer koli itu.

### C12 · Tracking SOQ: lihat posisi tiap koli
*Peran: Semua · saran 17 detik · file `frames/C12.png`*

Tracking SOQ menunjukkan tiap SOQ sudah sampai tahap mana: Picking, Verifikasi, TFS, Packing, Staging, Loading, Shipping, Diterima, hingga GR. Cocok untuk menjawab “barang toko ini sudah di mana?”.
