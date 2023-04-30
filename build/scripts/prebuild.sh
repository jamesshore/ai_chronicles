# Prerequisites to run tests or local server

echo "Installing build packages..." && npm --prefix=build install --no-audit --no-fund
echo "Installing front-end packages..." && npm --prefix=src/front_end install --no-audit --no-fund
