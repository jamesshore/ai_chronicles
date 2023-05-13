#!/bin/sh
set -euo pipefail

. _build/scripts/prebuild.sh

cd _build
node --enable-source-maps --experimental-import-meta-resolve scripts/run_build.js "$@"
