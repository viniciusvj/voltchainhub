#!/usr/bin/env bash
# Deploy the VoltchainHub backend API container to the consolidado.
# Serves same-origin at https://voltchainhub.org/api (nginx location ^~ /api/).
#
# Usage (Git Bash, from the repo root):
#   ./scripts/deploy-backend.sh
#
# Prereqs: SSH key at $KEY, backend already wired into the consolidado
# docker-compose (service voltchainhub-api) and nginx (location /api/).
# Read-only Amoy env is baked into the compose service; no secret needed.
set -euo pipefail

KEY="${KEY:-E:/Users/Vinicius/Desktop/awscustos/acesso-ssh/arrendamento.pem}"
HOST="ec2-user@98.94.144.237"
REMOTE_DIR="/opt/consolidado/voltchainhub-api"
HERE="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> packing backend (no node_modules/dist/data)"
TAR="$(mktemp -t vch-backend-XXXX.tgz)"
tar --exclude=node_modules --exclude=dist --exclude=data --exclude='*.db' \
    -czf "$TAR" -C "$HERE/backend" Dockerfile package.json package-lock.json tsconfig.json src

echo "==> uploading + extracting on the consolidado"
scp -i "$KEY" -o StrictHostKeyChecking=no "$TAR" "$HOST:$REMOTE_DIR/src.tgz"
rm -f "$TAR"

echo "==> rebuilding + restarting the container"
ssh -i "$KEY" -o StrictHostKeyChecking=no "$HOST" '
  set -e
  cd /opt/consolidado/voltchainhub-api && tar xzf src.tgz && rm -f src.tgz
  cd /opt/consolidado && sudo docker compose up -d --build voltchainhub-api
  sleep 6
  echo "--- health ---"
  curl -sk -H "Host: voltchainhub.org" https://localhost/api/health && echo
'

echo "==> done. Verify: curl -s https://voltchainhub.org/api/health"
