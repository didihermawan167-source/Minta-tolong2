#!/bin/sh
set -eu
AVD_CONFIG="$HOME/.android/avd/test.avd/config.ini"
if [ ! -f "$AVD_CONFIG" ]; then
  echo "Konfigurasi AVD tidak ditemukan: $AVD_CONFIG" >&2
  exit 1
fi
# The last run showed a system-level ANR caused by Android Bluetooth's
# AvrcpTargetService while system_server was under severe CPU pressure.
# Disable unused emulator hardware services to reduce background load.
{
  echo "hw.bluetooth=no"
  echo "hw.audioInput=no"
  echo "hw.audioOutput=no"
} >> "$AVD_CONFIG"
echo "Konfigurasi emulator QC: Bluetooth dan audio virtual dinonaktifkan."
grep -E '^(hw.bluetooth|hw.audioInput|hw.audioOutput)=' "$AVD_CONFIG"
