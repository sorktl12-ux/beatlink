#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DEPLOY_KEY="${HOME}/.ssh/id_ed25519_beatlink"

if [[ ! -f "$DEPLOY_KEY" ]]; then
  echo "✗ Deploy SSH key not found on this machine ($DEPLOY_KEY)"
  echo "  Production deploy runs only from your configured Mac."
  exit 1
fi

echo "▶ Building…"
npm run build

echo "▶ Deploying to Vercel (production)…"
if ! npx vercel deploy --prod --yes; then
  echo "✗ Vercel deploy failed. Run 'npx vercel login' on this machine first."
  exit 1
fi

echo "✓ Production deploy complete → https://www.beatlink.kr"
