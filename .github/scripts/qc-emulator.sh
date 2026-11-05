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
  if grep -Eiq 'ANR in system|Process system.*(not responding|isn.t responding)|system_server.*ANR' "$R/logcat-all.txt" "$R/dropbox-system-anr.txt" "$R/window.xml" 2>/dev/null; then
    echo "PERINGATAN QC: dialog ANR berasal dari Android System UI, bukan proses Minta Tolong. Mencoba memulihkan emulator tanpa menutup aplikasi." | tee "$R/system-anr-warning.txt"
    if grep -Fq 'System UI isn' "$R/window.xml"; then
      # Choose Android's Wait action, never Close app, then allow System UI to recover.
      adb shell input tap 540 1059 || true
      sleep 20
      adb shell dumpsys activity activities > "$R/activities-after-system-recovery.txt" 2>&1 || true
      adb shell dumpsys window windows > "$R/windows-after-system-recovery.txt" 2>&1 || true
      adb logcat -b all -d -v threadtime > "$R/logcat-after-system-recovery.txt" 2>&1 || true
      adb shell screencap -p /sdcard/qc-screen-recovered.png >/dev/null 2>&1 || true
      adb pull /sdcard/qc-screen-recovered.png "$R/screenshot-after-system-recovery.png" >/dev/null 2>&1 || true
      if grep -Fq 'ResumedActivity' "$R/activities-after-system-recovery.txt" && grep -Fq 'com.mintatolong.app' "$R/activities-after-system-recovery.txt"; then
        echo "System UI kembali memberi kesempatan aplikasi Minta Tolong tetap berada di depan setelah tindakan Wait." | tee "$R/system-anr-recovery.txt"
      else
        echo "System UI belum pulih dengan jelas; bukti tambahan disimpan dan hasil perlu pemeriksaan manual." | tee "$R/system-anr-recovery.txt"
      fi
    fi
  else
    echo "PERINGATAN QC: sinyal ANR terdeteksi tetapi pemilik proses belum dapat dipastikan. Bukti lengkap disimpan." | tee "$R/anr-owner-unknown.txt"
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
