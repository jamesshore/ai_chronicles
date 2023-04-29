#!/bin/sh

. build/scripts/prebuild.sh

cd build
while node scripts/watch.js "$@"; do
	echo "Restarting..."
done
