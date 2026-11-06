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
# Allow the React Native screen to settle, then collect evidence before
# deciding whether the UI is acceptable.
sleep 35
adb shell screencap -p /sdcard/qc-screen.png
adb pull /sdcard/qc-screen.png "$R/screenshot.png" >/dev/null 2>&1 || true
adb shell dumpsys meminfo > "$R/meminfo.txt" 2>&1 || true
adb shell dumpsys cpuinfo > "$R/cpuinfo.txt" 2>&1 || true
adb shell dumpsys window windows > "$R/windows.txt" 2>&1 || true
if adb shell uiautomator dump /sdcard/qc-window.xml >/dev/null 2>&1; then
  adb pull /sdcard/qc-window.xml "$R/window.xml" >/dev/null 2>&1 || true
fi
# Capture diagnostics before classifying any ANR dialog. A system-service ANR
# must not be misreported as an ANR in the Minta Tolong app.
adb logcat -d -t 12000 > "$R/logcat.txt" 2>&1 || true
if grep -F "ANR in $PACKAGE" "$R/logcat.txt" > "$R/app-anr.txt"; then
  echo "GAGAL APLIKASI: Android mencatat ANR pada $PACKAGE." | tee "$R/QC-RESULT.txt"
  exit 1
fi

if [ -s "$R/window.xml" ] && grep -Fq 'text="Process system isn' "$R/window.xml"; then
  grep -E 'ANR in |Reason:|Input dispatching timed out' "$R/logcat.txt" > "$R/emulator-anr.txt" || true
  if [ ! -s "$R/emulator-anr.txt" ]; then
    echo "GAGAL QC: dialog Process system tidak merespons muncul, tetapi pemilik ANR tidak dapat dipastikan." | tee "$R/QC-RESULT.txt"
    exit 1
  fi
  WAIT_BOUNDS="$(sed -n 's/.*resource-id="android:id/aerr_wait".*bounds="\\[\\([0-9]*\\),\\([0-9]*\\)\\]\\[\\([0-9]*\\),\\([0-9]*\\)\\]".*/\\1 \\2 \\3 \\4/p' "$R/window.xml" | head -n 1)"
  if [ -z "$WAIT_BOUNDS" ]; then
    echo "GAGAL QC: ANR sistem terdeteksi tetapi tombol Wait tidak ditemukan." | tee "$R/QC-RESULT.txt"
    exit 1
  fi
  set -- $WAIT_BOUNDS
  WAIT_X=$((($1 + $3) / 2))
  WAIT_Y=$((($2 + $4) / 2))
  adb shell input tap "$WAIT_X" "$WAIT_Y"
  sleep 10
  adb shell uiautomator dump /sdcard/qc-window-after-system-anr.xml >/dev/null 2>&1 || true
  adb pull /sdcard/qc-window-after-system-anr.xml "$R/window-after-system-anr.xml" >/dev/null 2>&1 || true
  adb shell screencap -p /sdcard/qc-screen-after-system-anr.png >/dev/null 2>&1 || true
  adb pull /sdcard/qc-screen-after-system-anr.png "$R/screenshot-after-system-anr.png" >/dev/null 2>&1 || true
  if grep -Fq 'text="Process system isn' "$R/window-after-system-anr.xml" 2>/dev/null; then
    echo "GAGAL INFRASTRUKTUR EMULATOR: ANR proses sistem tetap muncul setelah memilih Wait. Layar aplikasi belum dapat dinilai dengan andal." | tee "$R/QC-RESULT.txt"
    exit 1
  fi
fi

# An app-owned ANR or fatal exception is a failure; a system-service ANR
# is recorded separately and does not by itself prove the app is hung.
adb logcat -d -t 12000 > "$R/logcat.txt" 2>&1 || true
if grep -E 'FATAL EXCEPTION|ReactNativeJS: \\[.*(Error|Exception)|JavascriptException:' "$R/logcat.txt" > "$R/fatal-errors.txt"; then
  echo "GAGAL: ditemukan error fatal JavaScript/Android saat aplikasi dibuka." | tee "$R/QC-RESULT.txt"
  exit 1
fi
# Require the expected login controls to be present in the accessibility tree.
if [ ! -s "$R/window.xml" ] || ! grep -Eiq 'Masuk' "$R/window.xml" || ! grep -Eiq 'Daftar' "$R/window.xml"; then
  adb logcat -d -t 12000 > "$R/logcat.txt" || true
  echo "GAGAL UI: hierarki layar tidak membuktikan tombol Masuk dan Daftar tampil." | tee "$R/QC-RESULT.txt"
  exit 1
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
