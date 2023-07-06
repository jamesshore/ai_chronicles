# Prerequisites to run tests or local server
set -euo pipefail

echo "Installing build packages..." && npm --prefix=_build install --no-audit --no-fund
echo "Installing front-end packages..." && npm --prefix=front_end install --no-audit --no-fund
