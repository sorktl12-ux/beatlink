#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "▶ Building…"
npm run build

echo "▶ Deploying to Vercel (production)…"
npx vercel deploy --prod --yes

echo "✓ Production deploy complete → https://www.beatlink.kr"
