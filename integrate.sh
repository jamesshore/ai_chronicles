#!/bin/sh

. _build/scripts/prebuild.sh

node _build/scripts/integrate.js "$@"
