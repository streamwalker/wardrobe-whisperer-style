#!/usr/bin/env bash
set -euo pipefail
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"
output="$repo_root/artifacts/native-preview"
mkdir -p "$output"
xcrun simctl list devices available --json > "$RUNNER_TEMP/dripslayer-devices.json"
python3 - "$RUNNER_TEMP/dripslayer-devices.json" "$output/devices.json" <<'PY'
import json, sys
from pathlib import Path
source=json.loads(Path(sys.argv[1]).read_text())
devices=[dict(d, runtime=r) for r,ds in source['devices'].items() for d in ds if d.get('isAvailable')]
selected=[]
for family in ['iPhone','iPad']:
    choices=[d for d in devices if d['name'].startswith(family)]
    if not choices: raise SystemExit(f'No available {family} simulator')
    choices.sort(key=lambda d:(('Pro Max' in d['name'] if family=='iPhone' else '13-inch' in d['name']),d['runtime'],d['name']),reverse=True)
    d=choices[0]
    selected.append({'family':family,'name':d['name'],'udid':d['udid'],'runtime':d['runtime']})
Path(sys.argv[2]).write_text(json.dumps(selected,indent=2)+'\n')
PY
current_device=''
recorder_pid=''
cleanup() {
  if [[ -n "$recorder_pid" ]]; then kill -INT "$recorder_pid" 2>/dev/null || true; fi
  if [[ -n "$current_device" ]]; then xcrun simctl shutdown "$current_device" >/dev/null 2>&1 || true; fi
}
trap cleanup EXIT
trap 'exit 130' INT TERM
while IFS='|' read -r family device; do
  current_device="$device"
  xcrun simctl boot "$device" || true
  xcrun simctl bootstatus "$device" -b
  xcrun simctl ui "$device" appearance dark
  xcrun simctl status_bar "$device" override --time '9:41' --dataNetwork wifi --wifiMode active --wifiBars 3 --batteryState charged --batteryLevel 100
  xcrun simctl install "$device" "${SIMULATOR_APP:?}"
  xcrun simctl launch --terminate-running-process "$device" com.streamwalkers.dripslayer
  sleep 15
  xcrun simctl io "$device" screenshot "$output/$family-home.png"
  sleep 3
  xcrun simctl io "$device" screenshot "$output/$family-home-later.png"
  if [[ "$family" == iPhone ]]; then
    xcrun simctl io "$device" recordVideo --codec=h264 "$output/iPhone-motion.mp4" &
    recorder_pid=$!
    sleep 8
    kill -INT "$recorder_pid"
    wait "$recorder_pid" || true
    recorder_pid=''
  fi
  xcrun simctl shutdown "$device"
  current_device=''
done < <(python3 -c 'import json,sys; [print(d["family"]+"|"+d["udid"]) for d in json.load(open(sys.argv[1]))]' "$output/devices.json")
