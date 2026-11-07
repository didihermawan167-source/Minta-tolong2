#!/bin/sh
set -eu
R="$GITHUB_WORKSPACE/test-results"
APK="$R/minta-tolong.apk"
SDK="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-/usr/local/lib/android/sdk}}"

echo "Menunggu emulator siap..."
adb wait-for-device
BOOTED="$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r' || true)"
if [ "$BOOTED" != "1" ]; then
  echo "Emulator belum siap; status sys.boot_completed=$BOOTED"
  adb devices -l || true
  exit 1
fi
echo "Emulator selesai boot. Memeriksa layanan Android..."
SERVICES_READY=0
for attempt in $(seq 1 30); do
  if adb shell cmd package list packages >/dev/null 2>&1 && adb shell cmd activity get-config >/dev/null 2>&1; then
    SERVICES_READY=1
    break
  fi
  echo "Layanan package/activity belum siap (percobaan $attempt/30)."
  sleep 5
done
if [ "$SERVICES_READY" != "1" ]; then
  adb shell getprop > "$R/emulator-properties.txt" 2>&1 || true
  adb shell dumpsys -l > "$R/emulator-services.txt" 2>&1 || true
  echo "GAGAL QC: layanan package/activity Android emulator tidak siap; APK belum dapat diuji." | tee "$R/QC-RESULT.txt"
  exit 1
fi
echo "Layanan package dan activity siap."

# Avoid emulator-only Bluetooth service contention seen in the prior system ANR.
echo "Menonaktifkan adapter Bluetooth virtual sebelum uji aplikasi..."
adb shell settings put global bluetooth_on 0 >/dev/null 2>&1 || true
adb shell cmd bluetooth_manager disable >/dev/null 2>&1 || true
adb shell am force-stop com.android.bluetooth >/dev/null 2>&1 || true
sleep 10

# Reduce Android emulator background-service pressure before launching the app.
# Bluetooth is not needed by Minta Tolong's current QC path; disabling it is
# an environment-only mitigation, not an application-code change.
adb shell svc bluetooth disable > "$R/bluetooth-disable.txt" 2>&1 || true
adb shell settings put global bluetooth_on 0 >> "$R/bluetooth-disable.txt" 2>&1 || true
sleep 5
adb shell dumpsys bluetooth_manager > "$R/bluetooth-manager-before-launch.txt" 2>&1 || true

AAPT="$(find "$SDK/build-tools" -type f -name aapt -print -quit 2>/dev/null || true)"
if [ -n "$AAPT" ]; then
  "$AAPT" dump badging "$APK" > "$R/apk-info.txt"
  "$AAPT" dump permissions "$APK" > "$R/permissions.txt"
  PACKAGE="$(sed -n "s/^package: name='\\([^']*\\)'.*/\\1/p" "$R/apk-info.txt" | head -n 1)"
  ACTIVITY="$(sed -n "s/^launchable-activity: name='\\([^']*\\)'.*/\\1/p" "$R/apk-info.txt" | head -n 1)"
else
  PACKAGE="$(apkanalyzer manifest application-id "$APK")"
  ACTIVITY=""
  echo "aapt tidak tersedia; package diperiksa dengan apkanalyzer." > "$R/apk-info.txt"
fi

test -n "$PACKAGE"
echo "$PACKAGE" | tee "$R/package.txt"
if [ "$PACKAGE" != "com.mintatolong.app" ]; then
  echo "GAGAL: package APK tidak sesuai. Diharapkan com.mintatolong.app, ditemukan $PACKAGE." | tee "$R/QC-RESULT.txt"
  exit 1
fi
if ! adb install -r "$APK" > "$R/install.txt" 2>&1; then
  cat "$R/install.txt"
  adb shell dumpsys -l > "$R/emulator-services.txt" 2>&1 || true
  adb logcat -d -t 5000 > "$R/logcat-install-failure.txt" 2>&1 || true
  echo "GAGAL QC: Android Package Manager menolak instalasi atau layanan emulator terputus." | tee "$R/QC-RESULT.txt"
  exit 1
fi
cat "$R/install.txt"

if [ -z "$ACTIVITY" ]; then
  RESOLVED="$(adb shell cmd package resolve-activity --brief "$PACKAGE" 2>/dev/null | tr -d '\r' | tail -n 1)"
  case "$RESOLVED" in */*) ACTIVITY="$RESOLVED" ;; esac
else
  ACTIVITY="$PACKAGE/$ACTIVITY"
fi
if [ -z "$ACTIVITY" ]; then
  echo "GAGAL: aktivitas peluncur tidak ditemukan untuk $PACKAGE" | tee "$R/QC-RESULT.txt"
  exit 1
fi

echo "$ACTIVITY" | tee "$R/launcher-activity.txt"
adb shell am force-stop "$PACKAGE" || true
adb logcat -c
# Do not trust am start -W alone: on slow emulators it can time out while
# the app is still loading. Verify the foreground activity and process later.
adb shell am start -n "$ACTIVITY" 2>&1 | tee "$R/launch.txt"
sleep 35
# Preserve evidence before classifying any ANR. These files help distinguish
# an app-owned ANR from Android system/emulator pressure.
capture_diagnostics() {
  adb shell screencap -p /sdcard/qc-screen.png >/dev/null 2>&1 || true
  adb pull /sdcard/qc-screen.png "$R/screenshot.png" >/dev/null 2>&1 || true
  adb shell dumpsys activity activities > "$R/activities.txt" 2>&1 || true
  adb shell dumpsys window windows > "$R/windows.txt" 2>&1 || true
  adb shell dumpsys activity processes > "$R/activity-processes.txt" 2>&1 || true
  adb shell dumpsys dropbox --print data_app_anr > "$R/dropbox-app-anr.txt" 2>&1 || true
  adb shell dumpsys dropbox --print system_app_anr > "$R/dropbox-system-anr.txt" 2>&1 || true
  adb logcat -b all -d -v threadtime > "$R/logcat-all.txt" 2>&1 || true
}
# Capture the visible Android window tree, then preserve a complete diagnostic
# bundle whenever an ANR signal is present.
if adb shell uiautomator dump /sdcard/qc-window.xml >/dev/null 2>&1; then
  adb pull /sdcard/qc-window.xml "$R/window.xml" >/dev/null 2>&1 || true
fi
capture_diagnostics
ANR_FOUND=0
if grep -Eiq 'not responding|isn.t responding|ANR in ' "$R/window.xml" "$R/logcat-all.txt" "$R/dropbox-app-anr.txt" "$R/dropbox-system-anr.txt" 2>/dev/null; then
  ANR_FOUND=1
  grep -Ein -C 3 'not responding|isn.t responding|ANR in |Reason:|Subject:' "$R/window.xml" "$R/logcat-all.txt" "$R/dropbox-app-anr.txt" "$R/dropbox-system-anr.txt" > "$R/anr-evidence.txt" 2>/dev/null || true
fi
if [ "$ANR_FOUND" = "1" ]; then
  if grep -Eiq 'ANR in com\.mintatolong\.app|Process com\.mintatolong\.app.*(not responding|isn.t responding)|text="Minta Tolong.*(not responding|isn.t responding)' "$R/logcat-all.txt" "$R/dropbox-app-anr.txt" "$R/window.xml" 2>/dev/null; then
    echo "GAGAL QC: bukti ANR mengarah ke proses aplikasi Minta Tolong. Diagnostik lengkap disimpan." | tee "$R/QC-RESULT.txt"
    exit 1
  fi

  # Android may show a generic system ANR dialog while a different system
  # process (for example Bluetooth) is blocked. Classify it separately from
  # an ANR owned by the app; never tap Close app.
  SYSTEM_DIALOG=0
  if grep -Eiq 'Process system isn.t responding|system isn.t responding|System UI isn.t responding|System process.*not responding' "$R/window.xml"; then
    SYSTEM_DIALOG=1
  fi
  SYSTEM_ANR=0
  if grep -Eiq 'ANR in (system|com\.android\.bluetooth)|Process (system|com\.android\.bluetooth).*not responding|system_server.*ANR' "$R/logcat-all.txt" "$R/dropbox-system-anr.txt" 2>/dev/null; then
    SYSTEM_ANR=1
  fi

  if [ "$SYSTEM_DIALOG" = "1" ] || [ "$SYSTEM_ANR" = "1" ]; then
    {
      echo "PERINGATAN QC: ANR/dialog berasal dari Android atau layanan sistem, bukan bukti ANR aplikasi Minta Tolong."
      echo "Dialog sistem terdeteksi: $SYSTEM_DIALOG"
      echo "ANR proses sistem terdeteksi: $SYSTEM_ANR"
    } | tee "$R/system-anr-warning.txt"

    # Android can queue ANR dialogs from several system processes (for
    # example Quickstep after System UI). Recover each visible dialog safely
    # by selecting only its explicit Wait button, never Close app.
    RECOVERY_ROUND=0
    while [ "$RECOVERY_ROUND" -lt 4 ]; do
      RECOVERY_ROUND=$((RECOVERY_ROUND + 1))
      if adb shell uiautomator dump /sdcard/qc-window-recovery.xml >/dev/null 2>&1; then
        adb pull /sdcard/qc-window-recovery.xml "$R/window-recovery-$RECOVERY_ROUND.xml" >/dev/null 2>&1 || true
      fi
      CURRENT_WINDOW="$R/window-recovery-$RECOVERY_ROUND.xml"
      [ -s "$CURRENT_WINDOW" ] || break
      if ! grep -Eiq "isn.t responding|not responding" "$CURRENT_WINDOW"; then
        break
      fi
      WAIT_BOUNDS="$(python3 - "$CURRENT_WINDOW" <<'PY'
import re, sys, xml.etree.ElementTree as ET
try:
    root = ET.parse(sys.argv[1]).getroot()
    for node in root.iter():
        label = " ".join((node.attrib.get(k, "") for k in ("text", "content-desc"))).strip().lower()
        bounds = node.attrib.get("bounds", "")
        if label == "wait" and node.attrib.get("clickable") == "true" and re.fullmatch(r"\[\d+,\d+\]\[\d+,\d+\]", bounds):
            print(bounds)
            break
except Exception:
    pass
PY
)"
      [ -n "$WAIT_BOUNDS" ] || break
      WAIT_X="$(printf '%s' "$WAIT_BOUNDS" | sed -E 's/\[([0-9]+),([0-9]+)\]\[([0-9]+),([0-9]+)\]/\1 \3/')"
      WAIT_Y="$(printf '%s' "$WAIT_BOUNDS" | sed -E 's/\[([0-9]+),([0-9]+)\]\[([0-9]+),([0-9]+)\]/\2 \4/')"
      WAIT_X="$(printf '%s' "$WAIT_X" | awk '{print int(($1+$2)/2)}')"
      WAIT_Y="$(printf '%s' "$WAIT_Y" | awk '{print int(($1+$2)/2)}')"
      adb shell input tap "$WAIT_X" "$WAIT_Y" || true
      echo "Pemulihan dialog sistem putaran $RECOVERY_ROUND: Wait pada $WAIT_X,$WAIT_Y." >> "$R/system-anr-recovery.txt"
      sleep 20
    done

    if adb shell uiautomator dump /sdcard/qc-window-after-recovery.xml >/dev/null 2>&1; then
      adb pull /sdcard/qc-window-after-recovery.xml "$R/window-after-system-recovery.xml" >/dev/null 2>&1 || true
    fi
    capture_diagnostics
    adb shell dumpsys activity activities > "$R/activities-after-system-recovery.txt" 2>&1 || true
    adb shell screencap -p /sdcard/qc-screen-recovered.png >/dev/null 2>&1 || true
    adb pull /sdcard/qc-screen-recovered.png "$R/screenshot-after-system-recovery.png" >/dev/null 2>&1 || true

    if grep -Eiq 'ANR in com\.mintatolong\.app|Process com\.mintatolong\.app.*(not responding|isn.t responding)' "$R/logcat-all.txt" "$R/dropbox-app-anr.txt" 2>/dev/null; then
      echo "GAGAL QC: setelah pemulihan sistem ditemukan bukti ANR pada aplikasi Minta Tolong." | tee "$R/QC-RESULT.txt"
      exit 1
    fi
    if [ ! -s "$R/window-after-system-recovery.xml" ]; then
      echo "GAGAL QC INFRASTRUKTUR: hierarki layar setelah pemulihan tidak berhasil direkam; hasil aplikasi belum dapat dinilai." | tee "$R/QC-RESULT.txt"
      exit 1
    fi
    if grep -Eiq 'isn.t responding|not responding' "$R/window-after-system-recovery.xml"; then
      echo "GAGAL QC INFRASTRUKTUR: dialog ANR Android masih aktif setelah empat upaya Wait; hasil aplikasi belum dapat dinilai." | tee "$R/QC-RESULT.txt"
      exit 1
    fi
    # Treat the app smoke test separately from an emulator-only system ANR.
    # The app passes this stage only if it remains foregrounded and its
    # expected login/register controls are present in the recovered UI tree.
    adb shell pidof "$PACKAGE" > "$R/app-pid.txt" 2>&1 || true
    adb shell dumpsys activity activities > "$R/activities-after-system-recovery.txt" 2>&1 || true
    if [ ! -s "$R/app-pid.txt" ] || ! grep -F "$PACKAGE" "$R/activities-after-system-recovery.txt" | grep -Eq 'ResumedActivity|topResumedActivity|mResumed'; then
      echo "GAGAL QC: setelah ANR sistem dibersihkan, aplikasi tidak terbukti hidup di latar depan." | tee "$R/QC-RESULT.txt"
      exit 1
    fi
    if ! grep -Eiq 'Masuk' "$R/window-after-system-recovery.xml" || ! grep -Eiq 'Daftar' "$R/window-after-system-recovery.xml"; then
      echo "GAGAL QC: layar login/pendaftaran belum terverifikasi setelah pemulihan sistem." | tee "$R/QC-RESULT.txt"
      exit 1
    fi
    echo "PERINGATAN INFRASTRUKTUR: Android memunculkan ANR pada layanan sistem selama boot, tetapi dialog berhasil dipulihkan. Aplikasi Minta Tolong tetap hidup di depan dan kontrol Masuk/Daftar terverifikasi." | tee "$R/system-anr-warning.txt"
    echo "LULUS UJI APLIKASI: proses Minta Tolong hidup, aktivitas tampil di depan, dan tombol Masuk serta Daftar terdeteksi. Catatan: emulator sempat mengalami ANR layanan sistem." | tee "$R/QC-RESULT.txt"
    exit 0
  else
    echo "GAGAL QC: sinyal ANR terdeteksi tetapi pemilik proses belum dapat dipastikan. Bukti lengkap disimpan." | tee "$R/anr-owner-unknown.txt"
    exit 1
  fi
fi
adb shell pidof "$PACKAGE" | tee "$R/app-pid.txt"
test -s "$R/app-pid.txt"

adb shell dumpsys activity activities > "$R/activities.txt"
if ! grep -F "$PACKAGE" "$R/activities.txt" | grep -Eq 'ResumedActivity|topResumedActivity|mResumed'; then
  echo "GAGAL: proses hidup tetapi layar utama aplikasi tidak terdeteksi di depan." | tee "$R/QC-RESULT.txt"
  adb logcat -d -t 8000 > "$R/logcat.txt" || true
  exit 1
fi

adb logcat -d -t 8000 > "$R/logcat.txt"
if grep -E 'FATAL EXCEPTION|ReactNativeJS: \[.*(Error|Exception)|JavascriptException:' "$R/logcat.txt" > "$R/fatal-errors.txt"; then
  echo "GAGAL: ditemukan error fatal JavaScript/Android saat aplikasi dibuka." | tee "$R/QC-RESULT.txt"
  exit 1
fi

adb shell screencap -p /sdcard/qc-screen.png
adb pull /sdcard/qc-screen.png "$R/screenshot.png"
test -s "$R/screenshot.png"
echo "LULUS: APK terpasang, aktivitas aplikasi tampil di depan, proses tetap hidup, dan tidak ditemukan crash fatal." | tee "$R/QC-RESULT.txt"
