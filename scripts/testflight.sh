#!/usr/bin/env bash
# Builds apps/mobile for iOS and uploads it to TestFlight. Args pick which steps
# run; no args runs all of them, in order.
#
#   install    pnpm install --frozen-lockfile at the repo root
#   prebuild   expo prebuild, regenerating apps/mobile/ios/ from app.json
#   webview    vite build of the card editor page the app bundles
#   archive    xcodebuild archive of the Doska scheme
#   export     xcodebuild -exportArchive, which also does the upload
#
#   BUILD_NUMBER   CFBundleVersion for this build; App Store Connect rejects a
#                  duplicate     (default: commit count, so it only ever grows)
#   BUILD_DIR      archive + export output   (default apps/mobile/ios/build/testflight)
#   TEAM_ID        Apple Developer team      (default K8DARP5MT7, as in the pbxproj)
#   SCHEME         Xcode scheme              (default Doska)
#   CONFIGURATION  Xcode configuration       (default Release)
#
# Upload credentials, named to match the secrets release.yml already uses. Pass
# the key either as a path or base64, the script accepts both:
#
#   APPLE_API_KEY        App Store Connect key id, e.g. ABC123DEF4
#   APPLE_API_ISSUER     the issuer uuid from the same Keys page
#   APPLE_API_KEY_PATH   path to AuthKey_<id>.p8
#   APPLE_API_KEY_P8     base64 of that same file, used when no path is given
#
#   ./scripts/testflight.sh
#   BUILD_NUMBER=42 ./scripts/testflight.sh archive export
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
MOBILE="$ROOT/apps/mobile"
APP_JSON="$MOBILE/app.json"

BUILD_NUMBER=${BUILD_NUMBER:-$(git -C "$ROOT" rev-list --count HEAD)}
BUILD_DIR=${BUILD_DIR:-$MOBILE/ios/build/testflight}
TEAM_ID=${TEAM_ID:-K8DARP5MT7}
SCHEME=${SCHEME:-Doska}
CONFIGURATION=${CONFIGURATION:-Release}

WORKSPACE="$MOBILE/ios/$SCHEME.xcworkspace"
ARCHIVE_PATH="$BUILD_DIR/$SCHEME.xcarchive"
EXPORT_OPTIONS="$BUILD_DIR/ExportOptions.plist"

step() { printf '\n==> %s\n' "$1"; }
fail() { printf '  x %s\n' "$1" >&2; exit 1; }

# Xcode's automatic signing is the whole reason this runs on a dev Mac without
# any keychain plumbing. Say so up front rather than failing deep inside a build.
preflight() {
  [ "$(uname -s)" = "Darwin" ] || fail "iOS builds need macOS"
  command -v xcodebuild > /dev/null || fail "xcodebuild not found, install Xcode and its command line tools"
  command -v pnpm > /dev/null || fail "pnpm not found"
}

# The p8 is a credential, so a decoded copy lives in a private temp dir that
# goes away on exit, whatever the exit was.
resolve_api_key() {
  if [ -n "${APPLE_API_KEY_PATH:-}" ]; then return; fi
  if [ -z "${APPLE_API_KEY_P8:-}" ]; then return; fi
  local dir
  dir=$(mktemp -d)
  chmod 700 "$dir"
  TEMP_KEY_DIR="$dir"
  APPLE_API_KEY_PATH="$dir/AuthKey_${APPLE_API_KEY:-key}.p8"
  printf '%s' "$APPLE_API_KEY_P8" | base64 --decode > "$APPLE_API_KEY_PATH"
}

cleanup() {
  if [ -n "${APP_JSON_BACKUP:-}" ] && [ -f "$APP_JSON_BACKUP" ]; then
    mv "$APP_JSON_BACKUP" "$APP_JSON"
  fi
  if [ -n "${TEMP_KEY_DIR:-}" ]; then rm -rf "$TEMP_KEY_DIR"; fi
}
trap cleanup EXIT

do_install() {
  step "pnpm install"
  (cd "$ROOT" && pnpm install --frozen-lockfile)
}

# app.json is the source of truth for the native project, so the build number is
# stamped there and prebuild carries it into CFBundleVersion. The file is
# restored on exit so a release never shows up as a working tree change.
do_prebuild() {
  step "expo prebuild (build number $BUILD_NUMBER)"
  APP_JSON_BACKUP="$APP_JSON.testflight-backup"
  cp "$APP_JSON" "$APP_JSON_BACKUP"
  node -e '
    const fs = require("fs");
    const [file, buildNumber] = process.argv.slice(1);
    const json = JSON.parse(fs.readFileSync(file, "utf8"));
    json.expo.ios.buildNumber = buildNumber;
    fs.writeFileSync(file, JSON.stringify(json, null, 2) + "\n");
  ' "$APP_JSON" "$BUILD_NUMBER"
  # prebuild defaults to recreating ios/ from scratch, and its dirty-tree guard
  # would prompt over the app.json edit two lines up, which is the script's own
  # doing. EXPO_NO_GIT_STATUS skips the guard so the run stays non-interactive.
  (cd "$MOBILE" && APP_VARIANT= EXPO_NO_GIT_STATUS=1 pnpm exec expo prebuild --platform ios)
}

do_webview() {
  step "webview build"
  (cd "$ROOT" && pnpm --filter webview build)
}

do_archive() {
  step "xcodebuild archive"
  [ -d "$WORKSPACE" ] || fail "$WORKSPACE missing, run the prebuild step first"
  mkdir -p "$BUILD_DIR"
  # The bundling phase runs the Expo CLI as `node <path-to-cli>`, going around
  # the pnpm bin shim that would normally export NODE_PATH. Without it Babel
  # cannot resolve babel-preset-expo, which pnpm only links inside the store.
  # Build settings passed here reach the script phase as environment variables.
  xcodebuild archive \
    -workspace "$WORKSPACE" \
    -scheme "$SCHEME" \
    -configuration "$CONFIGURATION" \
    -destination "generic/platform=iOS" \
    -archivePath "$ARCHIVE_PATH" \
    -allowProvisioningUpdates \
    DEVELOPMENT_TEAM="$TEAM_ID" \
    NODE_PATH="$ROOT/node_modules/.pnpm/node_modules"
}

write_export_options() {
  mkdir -p "$BUILD_DIR"
  cat > "$EXPORT_OPTIONS" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>method</key>
	<string>app-store-connect</string>
	<key>destination</key>
	<string>upload</string>
	<key>teamID</key>
	<string>$TEAM_ID</string>
	<key>signingStyle</key>
	<string>automatic</string>
	<key>uploadSymbols</key>
	<true/>
</dict>
</plist>
PLIST
}

do_export() {
  step "xcodebuild -exportArchive (upload)"
  [ -d "$ARCHIVE_PATH" ] || fail "$ARCHIVE_PATH missing, run the archive step first"
  resolve_api_key
  write_export_options

  local auth=()
  if [ -n "${APPLE_API_KEY_PATH:-}" ]; then
    [ -f "$APPLE_API_KEY_PATH" ] || fail "APPLE_API_KEY_PATH points at nothing: $APPLE_API_KEY_PATH"
    [ -n "${APPLE_API_KEY:-}" ] || fail "APPLE_API_KEY (the key id) is required alongside the .p8"
    [ -n "${APPLE_API_ISSUER:-}" ] || fail "APPLE_API_ISSUER is required alongside the .p8"
    auth=(
      -authenticationKeyPath "$APPLE_API_KEY_PATH"
      -authenticationKeyID "$APPLE_API_KEY"
      -authenticationKeyIssuerID "$APPLE_API_ISSUER"
    )
  else
    printf '  ! no App Store Connect API key given, falling back to the Xcode account in your keychain\n'
  fi

  xcodebuild -exportArchive \
    -archivePath "$ARCHIVE_PATH" \
    -exportOptionsPlist "$EXPORT_OPTIONS" \
    -exportPath "$BUILD_DIR/export" \
    -allowProvisioningUpdates \
    "${auth[@]+"${auth[@]}"}"
}

preflight
steps=("$@")
if [ ${#steps[@]} -eq 0 ]; then steps=(install prebuild webview archive export); fi
for s in "${steps[@]}"; do
  case "$s" in
    install) do_install ;;
    prebuild) do_prebuild ;;
    webview) do_webview ;;
    archive) do_archive ;;
    export) do_export ;;
    *) fail "unknown step: $s (install prebuild webview archive export)" ;;
  esac
done

printf '\nDone. Build %s is processing in App Store Connect.\n' "$BUILD_NUMBER"
