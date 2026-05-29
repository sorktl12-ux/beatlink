#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

"$ROOT/scripts/sync.sh" "$@"
"$ROOT/scripts/deploy.sh"

echo "✓ Sync + deploy complete"
