# Mesin Agen AI — Minta Tolong AI Center

## Yang sudah dibangun
- GitHub Issues menjadi antrean tugas yang tercatat.
- AI Manager memanggil model AI melalui OpenAI Responses API.
- Satu proses mengoordinasikan peran Manager, Developer, QC, dan Reporter.
- Hasil analisis dan serah-terima peran ditulis kembali sebagai komentar tiket.
- Workflow memiliki batas waktu dan izin minimum.

## Mengaktifkan model
Tambahkan GitHub repository secret bernama `OPENAI_API_KEY` melalui Settings → Secrets and variables → Actions → New repository secret. Tambahkan variable `AI_MODEL` bila ingin memilih model; nilai awal kode adalah `gpt-4.1-mini`.

**Penting:** API key bukan bagian otomatis dari langganan ChatGPT dan penggunaan API dapat dikenai biaya terpisah. Jangan menambahkan secret sebelum Direktur menyetujui biaya. Jangan pernah menaruh key di source code, issue, atau chat.

## Cara kerja
Tiket dengan label `ai-task` memicu workflow. Manager membaca tiket, menyusun rencana, membagi peran, menentukan kriteria QC, dan melaporkan hasil. Lihat Actions → AI Center - Mesin Agen dan komentar pada tiket.

## Batas keselamatan rilis pertama
Versi ini adalah mesin koordinasi LLM nyata, bukan worker yang bebas menjalankan semua tugas. Ia tidak menjalankan perintah shell dari model, tidak menulis kode aplikasi, tidak mengakses pembayaran, dan tidak menerbitkan rilis. Perubahan kode otomatis membutuhkan worker terisolasi, allowlist file, pemeriksaan diff, tes, dan persetujuan manusia; itu harus menjadi tahap berikutnya.
