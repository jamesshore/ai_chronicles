# Prerequisites to run tests or local server

cd build
[ ! -f node_modules/.bin/mocha ] && echo "Installing packages..." && npm install
