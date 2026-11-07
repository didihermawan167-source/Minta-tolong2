#!/bin/sh
set -eu
R="$GITHUB_WORKSPACE/test-results"
mkdir -p "$R/auth-ui"

dump_ui() {
  adb shell uiautomator dump /sdcard/auth-ui.xml >/dev/null 2>&1
  adb pull /sdcard/auth-ui.xml "$R/auth-ui/current.xml" >/dev/null 2>&1
}
find_bounds() {
  LABEL="$1" MODE="$2" python3 - "$R/auth-ui/current.xml" <<'PY'
import os, re, sys, xml.etree.ElementTree as ET
label=os.environ["LABEL"].lower()
mode=os.environ["MODE"]
try:
    root=ET.parse(sys.argv[1]).getroot()
except Exception:
    raise SystemExit(1)
matches=[]
for node in root.iter():
    value=" ".join(node.attrib.get(k,"") for k in ("text","content-desc","hint")).strip()
    bounds=node.attrib.get("bounds","")
    if not value or not re.fullmatch(r"\[\d+,\d+\]\[\d+,\d+\]",bounds):
        continue
    ok = (label in value.lower()) if mode == "contains" else (label == value.lower())
    if ok:
        matches.append((node.attrib.get("class",""),node.attrib.get("clickable","false"),bounds,value))
if not matches:
    raise SystemExit(1)
# Prefer an actual clickable control for actions, and EditText for fields.
if mode == "click":
    matches.sort(key=lambda x: (x[1] != "true", "EditText" in x[0]))
elif mode == "field":
    matches.sort(key=lambda x: ("EditText" not in x[0], x[1] == "true"))
print(matches[0][2])
PY
}
tap_label() {
  label="$1"; mode="${2:-click}"
  dump_ui
  b="$(find_bounds "$label" "$mode")" || { echo "GAGAL AUTH UI: kontrol tidak ditemukan: $label"; exit 1; }
  x="$(printf '%s' "$b" | sed -E 's/\[([0-9]+),([0-9]+)\]\[([0-9]+),([0-9]+)\]/\1 \3/' | awk '{print int(($1+$2)/2)}')"
  y="$(printf '%s' "$b" | sed -E 's/\[([0-9]+),([0-9]+)\]\[([0-9]+),([0-9]+)\]/\2 \4/' | awk '{print int(($1+$2)/2)}')"
  adb shell input tap "$x" "$y"
  sleep 2
}
assert_text() {
  dump_ui
  if ! grep -Fqi "$1" "$R/auth-ui/current.xml"; then
    cp "$R/auth-ui/current.xml" "$R/auth-ui/failure.xml"
    echo "GAGAL AUTH UI: teks tidak ditemukan: $1" | tee "$R/auth-ui/RESULT.txt"
    exit 1
  fi
}
wait_text() {
  n=0
  while [ "$n" -lt 25 ]; do
    if dump_ui && grep -Fqi "$1" "$R/auth-ui/current.xml"; then return 0; fi
    n=$((n+1)); sleep 1
  done
  echo "GAGAL AUTH UI: menunggu teks: $1" | tee "$R/auth-ui/RESULT.txt"
  exit 1
}
tap_ok() {
  if dump_ui && grep -Fqi 'OK' "$R/auth-ui/current.xml"; then tap_label 'OK' click; fi
}
type_field() {
  hint="$1"; value="$2"
  tap_label "$hint" field
  adb shell input text "$value"
  sleep 1
}

echo "Memulai uji interaksi UI autentikasi tanpa mengirim permintaan ke Supabase."
# Wait for the initial async session check and redirect in app/index.tsx.
wait_text "Masuk"
assert_text "Masuk"
assert_text "Daftar"
adb shell screencap -p /sdcard/auth-login.png >/dev/null
adb pull /sdcard/auth-login.png "$R/auth-ui/login-screen.png" >/dev/null

# Empty login must be rejected locally.
tap_label "Masuk" click
wait_text "Email dan password wajib diisi."
cp "$R/auth-ui/current.xml" "$R/auth-ui/login-required-validation.xml"
tap_ok

# Navigate to registration and verify required-field validation.
tap_label "Belum punya akun? Daftar" contains
wait_text "Buat Akun"
assert_text "Nama"
assert_text "Email"
assert_text "Password"
tap_label "Daftar" click
wait_text "Semua data wajib diisi."
cp "$R/auth-ui/current.xml" "$R/auth-ui/register-required-validation.xml"
tap_ok

# Fill a local-only dummy form and verify minimum password length.
# The form is deliberately NOT submitted, so no test account is created.
type_field "Nama" "QC"
type_field "Email" "qc.invalid@example.invalid"
type_field "Password" "123"
tap_label "Daftar" click
wait_text "Gunakan minimal 6 karakter"
cp "$R/auth-ui/current.xml" "$R/auth-ui/password-length-validation.xml"
tap_ok

# Return to login to confirm the reverse navigation works.
tap_label "Sudah punya akun? Masuk" contains
wait_text "Minta Tolong"
assert_text "Masuk"
assert_text "Belum punya akun? Daftar"
cp "$R/auth-ui/current.xml" "$R/auth-ui/login-return.xml"

cat > "$R/auth-ui/RESULT.txt" <<'EOF'
LULUS UI AUTENTIKASI DASAR:
- Layar Masuk dan Daftar tampil.
- Tombol Masuk menolak kolom kosong.
- Navigasi Masuk ke Daftar berhasil.
- Tombol Daftar menolak kolom kosong.
- Validasi password minimal 6 karakter tampil.
- Navigasi Daftar kembali ke Masuk berhasil.
Batasan: formulir tidak dikirim; tidak membuat akun; belum menguji koneksi Supabase, konfirmasi email, login server, sesi, atau database.
EOF
cat "$R/auth-ui/RESULT.txt"
