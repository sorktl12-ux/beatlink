#!/usr/bin/env bash
# After agent work: offer deploy follow-up when source files changed.
input=$(cat)

if [[ "${BEATLINK_AUTO_DEPLOY:-}" != "1" ]]; then
  exit 0
fi

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

if git diff --quiet HEAD -- src/ supabase/ index.html package.json vercel.json tailwind.config.js 2>/dev/null \
  && git diff --cached --quiet -- src/ supabase/ index.html package.json vercel.json tailwind.config.js 2>/dev/null; then
  exit 0
fi

echo '{"followup_message": "코드 변경이 있습니다. npm run ship (GitHub sync + Vercel 배포)을 실행해 주세요."}'
exit 0
