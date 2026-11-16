#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"
node scripts/release/preflight.mjs
if [[ "$(uname -s)" != Darwin ]]; then
  echo 'A macOS runner with Xcode is required.' >&2
  exit 1
fi
if [[ "${GITHUB_ACTIONS:-}" != true ]]; then
  echo 'Use the GitHub iOS TestFlight workflow for this isolated signing setup; use Xcode automatic signing on your Mac.' >&2
  exit 1
fi

umask 077
signing_dir="$(mktemp -d "${RUNNER_TEMP:?}/dripslayer-signing.XXXXXX")"
keychain_path="$signing_dir/signing.keychain-db"
keychain_password="$(openssl rand -hex 32)"
installed_profiles=()
original_keychains=()
while IFS= read -r keychain; do original_keychains+=("$keychain"); done < <(security list-keychains -d user | sed -E 's/^[[:space:]]*"(.*)"$/\1/')

cleanup() {
  if (( ${#original_keychains[@]} )); then
    security list-keychains -d user -s "${original_keychains[@]}" >/dev/null 2>&1 || true
  fi
  security delete-keychain "$keychain_path" >/dev/null 2>&1 || true
  if (( ${#installed_profiles[@]} )); then
    for profile in "${installed_profiles[@]}"; do rm -f "$profile"; done
  fi
  rm -rf "$signing_dir"
}
trap cleanup EXIT
trap 'exit 130' INT TERM

printf '%s' "$IOS_DISTRIBUTION_P12_BASE64" | base64 --decode > "$signing_dir/distribution.p12"
printf '%s' "$IOS_PROVISIONING_PROFILE_BASE64" | base64 --decode > "$signing_dir/profile.mobileprovision"
security cms -D -i "$signing_dir/profile.mobileprovision" > "$signing_dir/profile.plist"
profile_id="$(python3 scripts/release/validate_profile.py deploy/apple-release.json "$signing_dir/profile.plist" "$signing_dir/ExportOptions.plist")"

security create-keychain -p "$keychain_password" "$keychain_path"
security set-keychain-settings -lut 21600 "$keychain_path"
security unlock-keychain -p "$keychain_password" "$keychain_path"
security import "$signing_dir/distribution.p12" -P "$IOS_DISTRIBUTION_P12_PASSWORD" -A -t cert -f pkcs12 -k "$keychain_path"
security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "$keychain_password" "$keychain_path" >/dev/null
security list-keychains -d user -s "$keychain_path" "${original_keychains[@]}"

# Xcode supports different profile locations across versions. Preserve any existing copies.
for profile_dir in "$HOME/Library/MobileDevice/Provisioning Profiles" "$HOME/Library/Developer/Xcode/UserData/Provisioning Profiles"; do
  mkdir -p "$profile_dir"
  target="$profile_dir/$profile_id.mobileprovision"
  if [[ -f "$target" ]]; then
    cmp -s "$target" "$signing_dir/profile.mobileprovision" || { echo 'An existing profile with this UUID differs; stopping.' >&2; exit 1; }
  else
    cp "$signing_dir/profile.mobileprovision" "$target"
    installed_profiles+=("$target")
  fi
done

output_dir="$repo_root/ios/App/output/${GITHUB_RUN_ID:?}-${GITHUB_RUN_ATTEMPT:-1}"
mkdir -p "$output_dir"
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release \
  -destination 'generic/platform=iOS' -archivePath "$output_dir/DripSlayer.xcarchive" \
  DEVELOPMENT_TEAM=32N9W9HZ54 CODE_SIGN_STYLE=Manual CODE_SIGN_IDENTITY='Apple Distribution' \
  "PROVISIONING_PROFILE_SPECIFIER=$profile_id" "CURRENT_PROJECT_VERSION=${RELEASE_BUILD_NUMBER:?}" archive
xcodebuild -exportArchive -archivePath "$output_dir/DripSlayer.xcarchive" \
  -exportOptionsPlist "$signing_dir/ExportOptions.plist" -exportPath "$output_dir/export"

ipa_path="$(python3 -c 'import pathlib,sys; files=list(pathlib.Path(sys.argv[1]).glob("*.ipa")); assert len(files)==1,"Expected exactly one IPA"; print(files[0])' "$output_dir/export")"
mkdir -p "$signing_dir/private_keys"
printf '%s' "$ASC_PRIVATE_KEY_BASE64" | base64 --decode > "$signing_dir/private_keys/AuthKey_${ASC_API_KEY_ID}.p8"
cd "$signing_dir"
xcrun altool --validate-app --type ios --file "$ipa_path" --apiKey "$ASC_API_KEY_ID" --apiIssuer "$ASC_ISSUER_ID"
if [[ "${UPLOAD_TO_TESTFLIGHT:-false}" == true ]]; then
  xcrun altool --upload-app --type ios --file "$ipa_path" --apiKey "$ASC_API_KEY_ID" --apiIssuer "$ASC_ISSUER_ID"
  echo 'Apple accepted the upload request. Processing and App Review submission are separate steps.'
else
  echo 'Signed archive exported and validated. Upload was not requested.'
fi
