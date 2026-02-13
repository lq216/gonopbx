#!/bin/bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
SITE_DIR="${PROJECT_DIR}/website-astro"
WEBROOT="/var/www/gonopbx"

if ! command -v npm >/dev/null 2>&1; then
  echo "ERROR: npm not found. Install Node.js/NPM first."
  exit 1
fi

if [ ! -d "$SITE_DIR" ]; then
  echo "ERROR: website-astro directory not found: $SITE_DIR"
  exit 1
fi

if [ ! -d "$WEBROOT" ]; then
  echo "ERROR: webroot not found: $WEBROOT"
  exit 1
fi

echo "Building website in $SITE_DIR ..."
cd "$SITE_DIR"

npm install
# Force local Directus for build to avoid DNS/network issues
export DIRECTUS_URL="${DIRECTUS_URL:-http://127.0.0.1:8055}"
npm run build

if [ ! -d "${SITE_DIR}/dist" ]; then
  echo "ERROR: build output not found: ${SITE_DIR}/dist"
  exit 1
fi

echo "Deploying to $WEBROOT ..."
rm -rf "${WEBROOT:?}"/*
cp -a "${SITE_DIR}/dist/." "$WEBROOT/"

# Ensure readable by web server user (optional but safe)
chown -R www-data:www-data "$WEBROOT" || true

echo "Done. Website deployed to $WEBROOT"
