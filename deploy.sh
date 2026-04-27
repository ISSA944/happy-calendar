#!/usr/bin/env bash

set -euo pipefail

SERVER_USER="root"
SERVER_HOST="157.22.198.107"
SERVER_DIR="/root/yoyojoy-backend"
LOCAL_BACKEND_DIR="backend/"

if ! command -v rsync >/dev/null 2>&1; then
  echo "rsync is required but not installed."
  exit 1
fi

echo "Syncing backend to ${SERVER_USER}@${SERVER_HOST}:${SERVER_DIR} ..."
ssh "${SERVER_USER}@${SERVER_HOST}" "mkdir -p ${SERVER_DIR}"

rsync -avz --delete \
  --exclude "node_modules" \
  --exclude "dist" \
  --exclude ".env" \
  --exclude ".env.prod" \
  "${LOCAL_BACKEND_DIR}" "${SERVER_USER}@${SERVER_HOST}:${SERVER_DIR}/"

echo "Starting containers on ${SERVER_HOST} ..."
ssh "${SERVER_USER}@${SERVER_HOST}" "cd ${SERVER_DIR} && docker-compose -f docker-compose.prod.yml up -d --build"

echo "Deploy completed."
