#!/bin/sh

. _build/scripts/prebuild.sh

cd _build
while node --enable-source-maps --experimental-import-meta-resolve scripts/watch.js "$@"; do
	echo "Restarting..."
done
