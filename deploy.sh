#!/usr/bin/env bash

set -euo pipefail

SERVER_USER="root"
SERVER_HOST="157.22.198.107"
BACKEND_DIR="/root/yoyojoy-backend"
FRONTEND_DIR="/root/yoyojoy-frontend"
LOCAL_BACKEND_DIR="backend/"

if ! command -v rsync >/dev/null 2>&1; then
  echo "rsync is required but not installed."
  exit 1
fi

DEPLOY_BACKEND=false
DEPLOY_FRONTEND=false

if [[ $# -eq 0 ]]; then
  DEPLOY_BACKEND=true
  DEPLOY_FRONTEND=true
fi

for arg in "$@"; do
  case $arg in
    backend) DEPLOY_BACKEND=true ;;
    frontend) DEPLOY_FRONTEND=true ;;
  esac
done

# ── Frontend ────────────────────────────────────────────────────────────────
if [[ "$DEPLOY_FRONTEND" == true ]]; then
  if [[ ! -f ".env.production" ]]; then
    echo "ERROR: .env.production not found. Create it with all VITE_ variables before deploying."
    exit 1
  fi

  echo "Building frontend..."
  npm run build

  echo "Uploading frontend dist to ${SERVER_HOST}:${FRONTEND_DIR} ..."
  ssh "${SERVER_USER}@${SERVER_HOST}" "mkdir -p ${FRONTEND_DIR}/dist"
  rsync -avz --delete dist/ "${SERVER_USER}@${SERVER_HOST}:${FRONTEND_DIR}/dist/"

  echo "Uploading nginx config..."
  scp nginx-frontend.conf "${SERVER_USER}@${SERVER_HOST}:/etc/nginx/sites-available/yoyojoy-frontend"
  ssh "${SERVER_USER}@${SERVER_HOST}" \
    "ln -sf /etc/nginx/sites-available/yoyojoy-frontend /etc/nginx/sites-enabled/yoyojoy-frontend && nginx -t && systemctl reload nginx"

  echo "Frontend deployed."
fi

# ── Backend ─────────────────────────────────────────────────────────────────
if [[ "$DEPLOY_BACKEND" == true ]]; then
  echo "Syncing backend to ${SERVER_USER}@${SERVER_HOST}:${BACKEND_DIR} ..."
  ssh "${SERVER_USER}@${SERVER_HOST}" "mkdir -p ${BACKEND_DIR}"
  rsync -avz --delete \
    --exclude "node_modules" \
    --exclude "dist" \
    --exclude ".env" \
    --exclude ".env.prod" \
    "${LOCAL_BACKEND_DIR}" "${SERVER_USER}@${SERVER_HOST}:${BACKEND_DIR}/"

  echo "Restarting backend containers..."
  ssh "${SERVER_USER}@${SERVER_HOST}" \
    "cd ${BACKEND_DIR} && docker compose -f docker-compose.prod.yml build api && docker compose -f docker-compose.prod.yml up -d api"

  echo "Backend deployed."
fi

echo "All done."
