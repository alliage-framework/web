#!/bin/bash

source "$NX_WORKSPACE_ROOT/scripts/_parameters.sh"
source "$NX_WORKSPACE_ROOT/scripts/_functions.sh"

ALLIAGE_WEB_VERSION=$(get_minimal_version $(jq -r ".version" "$NX_WORKSPACE_ROOT/packages/webserver/package.json") "^")
ALLIAGE_SANDBOX_VERSION=$(get_minimal_version $(jq -r ".devDependencies[\"@alliage/sandbox\"]" "$NX_WORKSPACE_ROOT/package.json") "^")

jq -r ".peerDependencies[\"$ALLIAGE_WEB_PACKAGE_NAME\"] = \"$ALLIAGE_WEB_VERSION\" | .peerDependencies[\"@alliage/sandbox\"] = \"$ALLIAGE_SANDBOX_VERSION\"" package.json >package.json.new
rm package.json
mv package.json.new package.json
