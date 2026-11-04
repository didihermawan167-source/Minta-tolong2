#!/usr/bin/env python3
"""Minta Tolong AI Center: bounded, auditable agent coordinator.

This first engine release performs real LLM-backed task analysis and department
handoffs. It deliberately does not execute model-generated shell commands or
write application source files. Code changes require a later reviewed worker.
"""
import json
import os
import sys
import urllib.error
import urllib.request

API = "https://api.github.com"
REPO = os.environ["GITHUB_REPOSITORY"]
TOKEN = os.environ["GITHUB_TOKEN"]
ISSUE_NUMBER = int(os.environ["ISSUE_NUMBER"])
OPENAI_KEY = os.environ.get("OPENAI_API_KEY", "")
MODEL = os.environ.get("AI_MODEL", "gpt-4.1-mini")


def request(url, method="GET", payload=None, bearer=TOKEN, extra_headers=None):
    data = None if payload is None else json.dumps(payload).encode()
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Authorization": f"Bearer {bearer}",
        "User-Agent": "MintaTolong-AICenter",
    }
    if data is not None:
        headers["Content-Type"] = "application/json"
    if extra_headers:
        headers.update(extra_headers)
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=45) as response:
        raw = response.read()
        return json.loads(raw) if raw else {}


def comment(body):
    request(f"{API}/repos/{REPO}/issues/{ISSUE_NUMBER}/comments",
            "POST", {"body": body})


def main():
    issue = request(f"{API}/repos/{REPO}/issues/{ISSUE_NUMBER}")
    title = issue.get("title", "")
    description = issue.get("body", "") or ""
    labels = [x["name"] for x in issue.get("labels", [])]
    if not OPENAI_KEY:
        comment(
            "## AI Center — Mesin Agen\\n\\n"
            "**Status: menunggu konfigurasi mesin model.**\\n\\n"
            "Penerimaan tugas dan antrean GitHub sudah aktif, tetapi agen belum "
            "dapat berpikir/menyusun hasil tanpa kredensial model AI. Tambahkan "
            "repository secret bernama `OPENAI_API_KEY` dan (opsional) repository "
            "variable `AI_MODEL`. Jangan kirim kunci API melalui Issue/chat. "
            "Kunci API dapat menimbulkan biaya penggunaan; jangan aktifkan sebelum "
            "Direktur menyetujui anggaran.\\n\\n"
            "Tidak ada perubahan kode atau tindakan berisiko yang dilakukan."
        )
        return

    prompt = f"""
Anda adalah AI Manager untuk kantor digital Minta Tolong.
Baca tiket kerja berikut, kemudian koordinasikan beberapa peran secara berurutan:
1. Manager: jelaskan tujuan dan pecah menjadi langkah kecil.
2. Developer: identifikasi file/komponen yang kemungkinan perlu dikerjakan.
3. QC: tulis kriteria uji yang dapat diverifikasi.
4. Reporter: buat ringkasan, risiko, dan langkah berikutnya.

Repo: {REPO}
Judul: {title}
Isi: {description}
Label: {labels}

Keluarkan JSON valid saja dengan bentuk:
{{
 "status":"plan_ready",
 "summary":"...",
 "department":"Developer|Quality Control|Build dan Deployment|Operasional",
 "tasks":[{{"role":"Manager|Developer|QC|Reporter","task":"...","acceptance":"..."}}],
 "checks":["..."],
 "risks":["..."],
 "approval_required":true,
 "report":"..."
}}
Jangan mengklaim sudah mengubah file, menjalankan tes, atau membuat APK.
Jangan meminta, menampilkan, atau menyalin rahasia. Jangan menyetujui pembayaran,
penghapusan data, produksi, atau publikasi. Jika butuh tindakan tersebut,
tandai approval_required true. Jangan mengeluarkan kode executable atau perintah shell.
"""
    body = {
        "model": MODEL,
        "input": prompt,
        "max_output_tokens": 2200,
    }
    try:
        result = request("https://api.openai.com/v1/responses", "POST", body,
                         bearer=OPENAI_KEY)
        text = ""
        for item in result.get("output", []):
            for part in item.get("content", []):
                if part.get("type") == "output_text":
                    text += part.get("text", "")
        if not text.strip():
            raise RuntimeError("Model tidak mengembalikan rencana teks.")
        start, end = text.find("{"), text.rfind("}")
        plan = json.loads(text[start:end + 1])
    except Exception as exc:
        comment("## AI Center — Mesin Agen\n**Status: gagal memproses tugas.**\n\n"
                f"Detail aman: `{type(exc).__name__}`. Periksa secret/model dan log Actions. "
                "Tidak ada perubahan kode yang dilakukan.")
        raise

    tasks = plan.get("tasks", [])
    lines = [
        "## AI Center — Laporan Mesin Agen",
        f"**Status:** {plan.get('status', 'plan_ready')}",
        f"**Departemen utama:** {plan.get('department', 'Operasional')}",
        "",
        "### Ringkasan Manager",
        plan.get("summary", ""),
        "",
        "### Penugasan antarperan",
    ]
    for i, task in enumerate(tasks, 1):
        lines += [f"{i}. **{task.get('role', 'Worker')}** — {task.get('task', '')}",
                  f"   - Kriteria selesai: {task.get('acceptance', '')}"]
    lines += ["", "### Pemeriksaan QC"]
    lines += [f"- {x}" for x in plan.get("checks", [])]
    lines += ["", "### Risiko"]
    lines += [f"- {x}" for x in plan.get("risks", [])]
    lines += ["", "### Laporan", plan.get("report", ""),
              "", "**Pengamanan:** rilis, pembayaran, penghapusan data, dan perubahan "
              "kode otomatis belum diizinkan oleh mesin tahap ini. Rencana ini bukan "
              "bukti tugas teknis sudah selesai."]
    if plan.get("approval_required", True):
        lines += ["", "**Persetujuan Direktur diperlukan** sebelum tindakan berisiko."]
    comment("\n".join(lines))


if __name__ == "__main__":
    main()
