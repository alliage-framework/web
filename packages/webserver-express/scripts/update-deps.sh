#!/bin/bash
source "$LERNA_ROOT_PATH/scripts/_parameters.sh"
source "$LERNA_ROOT_PATH/scripts/_functions.sh"

ALLIAGE_WEB_VERSION=$(get_minimal_version $(jq -r ".version" "$LERNA_ROOT_PATH/lerna.json") "^")
EXPRESS_VERSION=$(jq -r ".devDependencies.express" "$LERNA_ROOT_PATH/package.json")

jq -r ".peerDependencies.express = \"$EXPRESS_VERSION\" | .devDependencies[\"$ALLIAGE_WEB_PACKAGE_NAME\"] = \"$ALLIAGE_WEB_VERSION\"" package.json >package.json.new
rm package.json
mv package.json.new package.json
