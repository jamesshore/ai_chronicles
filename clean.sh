#!/bin/sh
set -euo pipefail

. _build/scripts/prebuild.sh
node _build/scripts/run_build.js clean
