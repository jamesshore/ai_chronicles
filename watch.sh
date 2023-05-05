#!/bin/sh

. _build/scripts/prebuild.sh

cd _build
while node scripts/watch.js "$@"; do
	echo "Restarting..."
done
