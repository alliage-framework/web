#!/bin/bash

source "$(dirname $(readlink -f $0))/_parameters.sh"
source "$(dirname $(readlink -f $0))/_functions.sh"

ALLIAGE_VERSION=$(get_minimal_version $(jq -r ".devDependencies[\"$ALLIAGE_PACKAGE_NAME\"]" "$LERNA_ROOT_PATH/package.json") "^")
ALLIAGE_CORE_VERSION=$(get_minimal_version $(jq -r ".devDependencies[\"$ALLIAGE_CORE_PACKAGE_NAME\"]" "$LERNA_ROOT_PATH/package.json") "^")
ALLIAGE_WEB_VERSION=$(get_minimal_version $(jq -r ".version" "$LERNA_ROOT_PATH/lerna.json") "^")
ALLIAGE_WEB_MODULE_NAME_PATTERN="$ALLIAGE_WEB_PACKAGE_NAME(.*)"

MANIFEST_DEPS=$(jq -r '.alliageManifest.dependencies | join(" ")' package.json)

PREVIOUS_PEER_DEPS=$(jq .peerDependencies package.json)
PEER_DEPS="{ \"$ALLIAGE_PACKAGE_NAME\": \"$ALLIAGE_VERSION\""
for package in $MANIFEST_DEPS; do
  [[ $package =~ ^$ALLIAGE_WEB_MODULE_NAME_PATTERN$ ]] && PACKAGE_VERSION=$ALLIAGE_WEB_VERSION || PACKAGE_VERSION=$ALLIAGE_CORE_VERSION
  PEER_DEPS="$PEER_DEPS, \"$package\": \"$PACKAGE_VERSION\""
done
PEER_DEPS="$PEER_DEPS }"

jq ".peerDependencies = $PREVIOUS_PEER_DEPS + $PEER_DEPS" package.json >package.json.new
rm package.json
mv package.json.new package.json

if [ -f "./scripts/update-deps.sh" ]; then
  bash "./scripts/update-deps.sh"
fi
