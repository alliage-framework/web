get_minimal_version() {
  VERSION=$1
  PREFIX=$2

  COERCED_VERSION=$(npx semver -c $VERSION)
  VERSION_SUFFIX=$(echo $VERSION | cut -sd "-" -f2)

  if [[ ! -z $VERSION_SUFFIX ]]; then
    echo "$PREFIX$COERCED_VERSION-$VERSION_SUFFIX"
    return 0
  fi

  MAJOR_VERSION=$(echo $COERCED_VERSION | cut -d . -f1)
  [[ $MAJOR_VERSION != "0" ]] && MINOR_VERSION="0" || MINOR_VERSION=$(echo $COERCED_VERSION | cut -d . -f2)
  [[ $MINOR_VERSION != "0" ]] && PATCH_VERSION="0" || PATCH_VERSION=$(echo $COERCED_VERSION | cut -d . -f3)

  echo "$PREFIX$MAJOR_VERSION.$MINOR_VERSION.$PATCH_VERSION"
}
