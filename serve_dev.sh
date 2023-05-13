#!/bin/sh
set -euo pipefail

. _build/scripts/prebuild.sh
node _build/scripts/serve_dev.js "$@"