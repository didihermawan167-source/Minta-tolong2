#!/usr/bin/env python3
"""Minta Tolong AI Center: bounded, auditable task coordinator.

Uses deterministic checklists without an API key, or LLM-backed planning when
configured. It never executes model-generated commands or writes source files.
"""
import json
import base64
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


def publish_report(body):
    """Publish the same evidence-bounded report to the ticket and Actions summary."""
    comment(body)
    summary_path = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary_path:
        with open(summary_path, "a", encoding="utf-8") as summary:
            summary.write(body + "\n")



def read_repo_file(path):
    """Read a repository file through GitHub's API; never writes to the repo."""
    item = request(f"{API}/repos/{REPO}/contents/{path}")
    encoded = item.get("content", "")
    if not encoded:
        raise RuntimeError(f"Isi file {path} kosong atau tidak tersedia.")
    return base64.b64decode(encoded).decode("utf-8")


def safe_repository_audit():
    """Run a small, read-only structural audit in zero-cost mode."""
    results = []
    try:
        package = json.loads(read_repo_file("package.json"))
        results.append(("package.json valid", True, "JSON berhasil dibaca"))
        dependencies = {**package.get("dependencies", {}),
                        **package.get("devDependencies", {})}
        results.append(("Dependensi Expo terdaftar", "expo" in dependencies,
                        "expo ditemukan" if "expo" in dependencies else "expo tidak ditemukan"))
    except Exception as exc:
        results.append(("package.json valid", False, type(exc).__name__))

    try:
        app = json.loads(read_repo_file("app.json"))
        expo = app.get("expo", {})
        results.append(("Konfigurasi app.json valid", bool(expo),
                        "objek expo ditemukan" if expo else "objek expo tidak ditemukan"))
        results.append(("Nama aplikasi tersedia", bool(expo.get("name")),
                        str(expo.get("name", "tidak ada"))))
        results.append(("Slug aplikasi tersedia", bool(expo.get("slug")),
                        str(expo.get("slug", "tidak ada"))))
    except Exception as exc:
        results.append(("Konfigurasi app.json valid", False, type(exc).__name__))

    for path in ("app/_layout.tsx", "app/index.tsx", "lib/supabase.ts"):
        try:
            read_repo_file(path)
            results.append((f"File {path} tersedia", True, "berhasil dibaca dari branch"))
        except Exception as exc:
            results.append((f"File {path} tersedia", False, type(exc).__name__))
    return results


def main():
    issue = request(f"{API}/repos/{REPO}/issues/{ISSUE_NUMBER}")
    title = issue.get("title", "")
    description = issue.get("body", "") or ""
    labels = [x["name"] for x in issue.get("labels", [])]
    if issue.get("state") != "open" or "ai-task" not in labels:
        raise RuntimeError("Tiket harus berstatus terbuka dan memiliki label ai-task.")
    if not OPENAI_KEY:
        # Zero-cost fallback: deterministic routing plus read-only repository audit.
        audit = safe_repository_audit()
        label_set = set(labels)
        if "dept-developer" in label_set:
            department = "Developer"
            tasks = [
                ("Manager", "Pastikan tujuan, ruang lingkup, dan file yang boleh disentuh jelas."),
                ("Developer", "Periksa kode terkait dan siapkan perubahan sekecil mungkin; jangan mengubah file di luar ruang lingkup."),
                ("QC", "Jalankan pemeriksaan statis yang tersedia dan catat hasilnya."),
                ("Reporter", "Laporkan file yang diperiksa, hasil, kendala, dan langkah berikutnya."),
            ]
        elif "dept-qc" in label_set:
            department = "Quality Control"
            tasks = [
                ("Manager", "Tetapkan bagian aplikasi dan kriteria lulus/gagal."),
                ("QC", "Periksa struktur proyek, konfigurasi, dan tes yang tersedia; jangan menyatakan tes perangkat nyata jika tidak dijalankan."),
                ("Developer", "Terima hanya temuan yang dapat direproduksi dan perbaiki setelah ruang lingkup disetujui."),
                ("Reporter", "Catat bukti, kegagalan, dan rekomendasi."),
            ]
        elif "dept-build" in label_set:
            department = "Build dan Deployment"
            tasks = [
                ("Manager", "Pastikan commit sumber dan profil build yang diminta."),
                ("Build", "Gunakan workflow build yang sudah ada; jangan memulai rilis publik atau layanan berbayar."),
                ("QC", "Verifikasi artefak APK dan laporan pemeriksaan."),
                ("Reporter", "Laporkan run, status, dan tautan artefak jika tersedia."),
            ]
        elif "dept-report" in label_set:
            department = "Pelaporan"
            tasks = [
                ("Manager", "Tentukan periode dan objek yang dipantau."),
                ("Reporter", "Kumpulkan status workflow, commit, tiket, dan artefak yang benar-benar tersedia."),
                ("QC", "Cocokkan klaim laporan dengan bukti GitHub."),
            ]
        else:
            department = "Operasional"
            tasks = [
                ("Manager", "Uraikan perintah menjadi langkah kecil dan tentukan penanggung jawab."),
                ("Operasional", "Periksa prasyarat dan catat pekerjaan yang dapat dilakukan tanpa biaya."),
                ("QC", "Periksa hasil berdasarkan kriteria yang tertulis."),
                ("Reporter", "Sampaikan status, kendala, dan keputusan yang dibutuhkan Direktur."),
            ]
        lines = [
            "## AI Center — Koordinasi Otomatis Tanpa Biaya",
            "**Status: rencana kerja berbasis aturan berhasil dibuat.**",
            "",
            "**Catatan kejujuran:** mode ini memakai aturan/checklist tetap, bukan model AI yang memahami bebas. Tidak memerlukan API key dan tidak menimbulkan biaya API.",
            f"**Departemen:** {department}",
            "",
            "### Perintah yang diterima",
            title,
            description,
            "",
            "### Serah-terima antarperan",
        ]
        for index, (role, task) in enumerate(tasks, 1):
            lines.append(f"{index}. **{role}:** {task}")
        lines += [
            "",
            "### Audit repositori otomatis (baca-saja)",
        ]
        for name, passed, detail in audit:
            status = "LULUS" if passed else "GAGAL"
            lines.append(f"- [{status}] {name}: {detail}")
        lines += [
            "",
            "### Gerbang QC",
            "- Hasil harus memiliki bukti yang bisa diperiksa (commit, log workflow, tes, atau artefak).",
            "- Jangan menyatakan pekerjaan selesai jika hanya berupa rencana.",
            "- Perubahan berisiko, pembayaran, penghapusan data, dan rilis publik tetap menunggu persetujuan Direktur.",
            "",
            "### Batas mode gratis",
            "Mesin ini dapat menerima tiket, mengelompokkan pekerjaan, membuat checklist, dan melaporkan status. Ia belum dapat menulis kode secara mandiri atau berpikir seperti LLM tanpa model eksternal."
        ]
        publish_report("\n".join(lines))
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
        publish_report("## AI Center — Mesin Agen\n**Status: gagal memproses tugas.**\n\n"
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
    publish_report("\n".join(lines))


if __name__ == "__main__":
    main()
