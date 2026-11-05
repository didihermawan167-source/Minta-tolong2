# Minta Tolong AI Center — AI Manager

## Tahap 1: pusat perintah aktif
Workflow `.github/workflows/ai-manager.yml` menerima perintah Direktur melalui GitHub Actions `workflow_dispatch`, menentukan departemen berdasarkan kata kunci, lalu membuat tiket kerja GitHub dengan prioritas dan status persetujuan.

## Departemen
- Operasional: koordinasi dan tugas umum.
- Developer: kode, fitur, bug, dan integrasi.
- Quality Control: pemeriksaan dan pengujian.
- Build dan Deployment: build APK dan rilis.
- Pelaporan: status dan laporan.

## Cara memberi perintah
Buka tab Actions, pilih **AI Manager - Pusat Perintah Direktur**, tekan **Run workflow**, isi perintah, pilih prioritas, lalu pilih status persetujuan. Hasil pembagian muncul sebagai tiket di Issues.

## Pengamanan
Perintah terkait hapus data, pembayaran, transfer, atau deploy publik ditandai tertahan bila persetujuan belum diberikan. Persetujuan di tiket bukan pengganti pemeriksaan manusia sebelum tindakan sensitif.

## Batas tahap ini
Ini adalah intake, klasifikasi sederhana, dan antrean tugas otomatis — bukan kumpulan model AI otonom yang berjalan terus-menerus. Agen AI yang benar-benar menganalisis repo, mengubah kode, menguji hasil, dan saling menyerahkan pekerjaan memerlukan runtime agen serta kredensial model/API yang disediakan pemilik. Jangan menyimpan token rahasia di kode atau tiket.


## Laporan pemeriksaan lanjutan — 5 November 2026

### Pemeriksaan CI gratis
- Workflow `.github/workflows/static-check.yml`, run #2 / ID `41992530750`, commit `b109851aa603844c5937b7623ecc96f1205e0aa3`: SUCCESS.
- Semua langkah selesai: sinkronisasi lockfile, penyimpanan lockfile, `npm ci`, `npx expo install --check`, dan `npx expo export --platform android`.
- Hasil ini memvalidasi dependensi dan bundel JavaScript Android. Ini bukan APK baru, bukan uji emulator pada commit terbaru, dan bukan uji perangkat Redmi.
- Build APK #46 / ID `41981304791` sebelumnya gagal karena kuota EAS Build gratis habis. Jangan mencoba build berbayar tanpa persetujuan Direktur.

### Temuan audit kode aplikasi
1. **Autentikasi masih demo lokal.** `app/register.tsx` dan `app/login.tsx` hanya menyimpan flag `loggedIn` dan profil ke AsyncStorage. Email/password tidak diverifikasi oleh Supabase atau server. Jangan menyebut akun tersebut sebagai akun online/aman.
2. **Permintaan bantuan memakai Supabase**, tetapi `app/request.tsx` mengharuskan izin lokasi dan menulis koordinat ke tabel `help_requests`. Skema tabel, kebijakan RLS, dan status aktif proyek Supabase belum terverifikasi dalam audit ini.
3. **Batas radius masih tertanam.** Insert permintaan mengirim `radius_m: 200`, bertentangan dengan arah produk terbaru untuk menghapus batas radius.
4. **Riwayat belum tersambung ke server.** `app/history.tsx` membaca daftar `requests` dari AsyncStorage, sedangkan permintaan baru dikirim ke Supabase. Karena itu riwayat dapat kosong walau permintaan server berhasil.
5. **Chat masih mode demo perangkat.** `app/chat.tsx` menyimpan pesan hanya di state layar dan tidak mengirim ke pengguna lain.
6. **Rating masih angka tetap 5.0** di profil, bukan hasil penilaian nyata.

### Urutan pekerjaan yang disarankan
- Pertama, verifikasi status proyek Supabase, skema tabel `help_requests`, dan RLS sebelum mengubah alur permintaan.
- Kedua, rancang autentikasi Supabase Auth dan migrasi akun demo dengan hati-hati; jangan menghapus data lokal pengguna.
- Ketiga, selaraskan permintaan, riwayat, dan daftar bantuan agar menggunakan sumber data server yang sama.
- Keempat, hilangkan `radius_m: 200` hanya setelah rancangan pencarian/pencocokan tanpa radius disepakati.
- Kelima, baru rancang chat, kategori keahlian, pembayaran, dan komisi. Pembayaran harus tetap nonaktif sampai penyedia, alur legal, dan pengamanan transaksi disetujui.

### Status bukti
- Pemeriksaan dependensi dan bundel: **LULUS** (run #41992530750).
- QC emulator terakhir yang tercatat: **LULUS pada commit lama** (run #41959499900, commit `08b12be`), bukan commit terbaru.
- Uji langsung Redmi: **belum dikonfirmasi**.
- APK baru dari commit terbaru: **belum tersedia**.
- Integrasi autentikasi, chat, riwayat server, rating, dan pembayaran: **belum siap produksi**.


## Keputusan Direktur — tanpa build berbayar

Per 5 November 2026, Direktur menetapkan bahwa proyek tidak akan membeli kuota EAS Build atau menggunakan layanan build berbayar untuk tahap ini. Tim harus memaksimalkan APK yang sudah tersedia dan jalur pemeriksaan gratis.

Aturan kerja:
- Jangan memicu atau meminta build EAS berbayar sebelum Direktur menyetujui pengeluaran.
- Lanjutkan audit kode, perbaikan yang aman, pemeriksaan dependensi, ekspor bundel, dan tes otomatis gratis.
- Jangan menyatakan aplikasi siap rilis hanya karena bundel berhasil diekspor.
- APK yang sudah terpasang digunakan untuk uji alur nyata di Redmi; catat hasil setiap layar dan fungsi.
- Pengeluaran kuota baru dipertimbangkan setelah alur inti berjalan semestinya, data dan keamanan diperiksa, serta hasil QC menunjukkan aplikasi layak diuji rilis.
- Pertahankan data akun lokal yang sudah dibuat. Jangan mengubah autentikasi atau melakukan migrasi data tanpa rencana pemulihan.

## Hasil investigasi ANR QC — bukti pembanding, 5 November 2026

- QC run #27 (41959499900) menguji build sumber 41954327967. APK SHA-256: 8aa8a33a50cc1d4c4526f387857c5923957db1995ca22917eadd6067e0822120. Instalasi berhasil, aplikasi tampil di foreground, proses hidup, dan tidak ada crash fatal. Hasil: LULUS.
- QC run #28 (41970447479) menguji build sumber yang sama, 41954327967, dengan SHA-256 APK yang sama persis: 8aa8a33a50cc1d4c4526f387857c5923957db1995ca22917eadd6067e0822120. Instalasi dan perintah membuka aplikasi berhasil, tetapi pemeriksaan UI mendeteksi dialog ANR menutupi aplikasi. Hasil: GAGAL QC.
- Perbandingan commit 08b12beb (run #27) ke 5fc3661d (run #28) hanya menunjukkan perubahan pada .github/scripts/qc-emulator.sh dan .github/workflows/test-apk-28.yml; tidak ada file aplikasi yang berubah di rentang tersebut.
- Karena APK identik pernah lulus dan kemudian gagal dengan dialog ANR, bukti saat ini belum membuktikan bug baru pada kode aplikasi. Ini mengarah pada kemungkinan ketidakstabilan emulator/host atau kondisi ANR sementara, tetapi penyebab pastinya belum terbukti.
- Log run #28 menunjukkan pemeriksaan lama mengklasifikasikan dialog ANR sebagai aplikasi atau komponen sistem; log itu tidak mengidentifikasi proses pemilik dialog. Jangan menghapus pemeriksaan ANR atau mengubah kode aplikasi hanya untuk membuat QC hijau.
- Run QC #30 (41981410689) berstatus SKIPPED karena build sumber #46 gagal lebih dulu. Build #46 (41981304791) gagal karena kuota EAS Build gratis bulan ini habis. Tidak ada APK baru yang dihasilkan dari commit tersebut.

### Tindakan lanjutan yang aman
1. Pertahankan status run #28 sebagai kegagalan QC yang sah; jangan ubah menjadi lulus secara administratif.
2. Pada pengujian emulator gratis berikutnya, rekam window.xml, screenshot, dumpsys activity, dumpsys window, dan logcat ANR lengkap; identifikasi apakah dialog berasal dari proses aplikasi, system, atau layanan emulator sebelum mengambil keputusan.
3. Bandingkan kondisi emulator pada satu APK yang sama dan gunakan hasil ulangan untuk menentukan apakah ANR dapat direproduksi.
4. Jangan memicu EAS Build berbayar atau mengubah file aplikasi sampai ada bukti yang mengaitkan ANR dengan kode aplikasi dan persetujuan biaya bila diperlukan.