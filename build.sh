#!/bin/sh

. build/scripts/prebuild.sh

cd build
node scripts/run_build.js "$@"
