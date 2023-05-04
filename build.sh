#!/bin/sh

. _build/scripts/prebuild.sh

cd _build
node scripts/run_build.js "$@"
