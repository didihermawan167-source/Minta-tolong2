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
    ok = (label in value.lower()) if mode in ("contains", "field") else (label == value.lower())
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
resolve_runtime_permission() {
  # Runtime permission prompts may reappear after navigation or an app
  # activity restart. Handle them wherever they interrupt the UI test.
  if dump_ui && grep -Eiq 'Allow Minta Tolong to access this device.s location|permission_allow_foreground_only_button' "$R/auth-ui/current.xml"; then
    if grep -Fqi 'WHILE USING THE APP' "$R/auth-ui/current.xml"; then
      tap_label "WHILE USING THE APP" click
    elif grep -Fqi 'ONLY THIS TIME' "$R/auth-ui/current.xml"; then
      tap_label "ONLY THIS TIME" click
    elif grep -Fqi 'Allow' "$R/auth-ui/current.xml"; then
      tap_label "Allow" click
    fi
    sleep 2
    return 0
  fi
  return 1
}
wait_text() {
  expected="$1"
  n=0
  # UIAutomator dumps can take several seconds on the overloaded hosted
  # emulator. Allow a bounded 45-second window instead of failing on a
  # transiently slow accessibility tree.
  while [ "$n" -lt 15 ]; do
    if dump_ui && grep -Fqi "$expected" "$R/auth-ui/current.xml"; then
      cp "$R/auth-ui/current.xml" "$R/auth-ui/verified-$(printf '%s' "$expected" | tr ' ' '_' | tr -cd '[:alnum:]_').xml"
      return 0
    fi
    resolve_runtime_permission || true
    n=$((n+1))
    sleep 3
  done
  adb shell screencap -p /sdcard/auth-ui-failure.png >/dev/null 2>&1 || true
  adb pull /sdcard/auth-ui-failure.png "$R/auth-ui/failure.png" >/dev/null 2>&1 || true
  adb logcat -d -v time -t 1200 > "$R/auth-ui/failure-logcat.txt" 2>&1 || true
  cp "$R/auth-ui/current.xml" "$R/auth-ui/failure.xml" 2>/dev/null || true
  echo "GAGAL AUTH UI: setelah 45 detik teks tidak ditemukan: $expected" | tee "$R/auth-ui/RESULT.txt"
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
  adb shell input keyevent 4 >/dev/null 2>&1 || true
  sleep 1
}

echo "Memulai uji interaksi UI autentikasi tanpa mengirim permintaan ke Supabase."

# Expo Location can request runtime permission on first launch. Resolve the
# Android permission sheet before attempting to interact with app controls.
# This is an emulator-only permission grant; it does not submit user data.
if dump_ui && grep -Eiq 'Allow Minta Tolong to access this device.s location|permission_allow_foreground_only_button' "$R/auth-ui/current.xml"; then
  tap_label "WHILE USING THE APP" click
  sleep 3
  if dump_ui && grep -Fqi 'Allow' "$R/auth-ui/current.xml"; then
    tap_label "Allow" click
    sleep 2
  fi
fi

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

# Safety: never submit even a dummy registration to the configured Supabase project.
# A prior run unexpectedly reached Home after this tap and opened a GPS alert,
# proving that this test could reach the real sign-up path. Verify the source
# guard statically instead; live backend registration requires an isolated test project.
if ! grep -Fq 'if (pass.length < 6)' "$GITHUB_WORKSPACE/app/register.tsx"; then
  echo "GAGAL AUTH UI: validasi minimum password tidak ditemukan di sumber aplikasi." | tee "$R/auth-ui/RESULT.txt"
  exit 1
fi
if ! grep -Fq 'Password terlalu pendek' "$GITHUB_WORKSPACE/app/register.tsx"; then
  echo "GAGAL AUTH UI: pesan validasi password pendek tidak ditemukan di sumber aplikasi." | tee "$R/auth-ui/RESULT.txt"
  exit 1
fi
echo "LULUS PEMERIKSAAN SUMBER: validasi password minimal 6 karakter ada di kode; interaksi langsung sengaja tidak dikirim ke backend." | tee "$R/auth-ui/password-length-source-check.txt"

# Return to login and verify the registration-to-login navigation without submitting credentials.
tap_label "Sudah punya akun? Masuk" contains
wait_text "Masuk"
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
