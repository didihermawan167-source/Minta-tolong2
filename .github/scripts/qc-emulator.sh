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
  adb shell getprop | grep -E 'init.svc.bootanim|sys.boot_completed' || true
  exit 1
fi
echo "Emulator siap."

AAPT="$(find "$SDK/build-tools" -type f -name aapt -print -quit 2>/dev/null || true)"
if [ -n "$AAPT" ]; then
  "$AAPT" dump badging "$APK" > "$R/apk-info.txt"
  "$AAPT" dump permissions "$APK" > "$R/permissions.txt"
  PACKAGE="$(sed -n "s/^package: name='\\([^']*\\)'.*/\\1/p" "$R/apk-info.txt" | head -n 1)"
else
  PACKAGE="$(apkanalyzer manifest application-id "$APK")"
  echo "aapt tidak tersedia; package diperiksa dengan apkanalyzer." > "$R/apk-info.txt"
fi

test -n "$PACKAGE"
echo "$PACKAGE" | tee "$R/package.txt"
adb install -r "$APK" 2>&1 | tee "$R/install.txt"
adb shell monkey -p "$PACKAGE" 1 2>&1 | tee "$R/launch.txt"
sleep 20
adb shell pidof "$PACKAGE" | tee "$R/app-pid.txt"
test -s "$R/app-pid.txt"
adb shell screencap -p /sdcard/qc-screen.png
adb pull /sdcard/qc-screen.png "$R/screenshot.png"
adb logcat -d -t 5000 > "$R/logcat.txt"
echo "LULUS: APK dapat dipasang, dibuka, dan proses aplikasi terdeteksi." | tee "$R/QC-RESULT.txt"
