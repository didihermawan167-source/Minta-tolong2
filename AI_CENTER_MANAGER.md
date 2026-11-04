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
