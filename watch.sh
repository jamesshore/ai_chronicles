#!/bin/sh

. build/scripts/prebuild.sh
while node scripts/watch.js "$@"; do
	echo "Restarting..."
done
