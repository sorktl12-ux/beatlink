#!/usr/bin/env bash
# One-time fix: run this in Terminal if desktop shortcuts don't work.
#   bash ~/beatlink/scripts/fix-desktop-shortcut.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DESKTOP="${HOME}/Desktop"
APP="${DESKTOP}/BEATLINK.app"
CMD="${DESKTOP}/BEATLINK 열기.command"
PREVIEW_CMD="${DESKTOP}/BEATLINK 미리보기.command"

chmod +x "${ROOT}/scripts/open-beatlink.sh"
chmod +x "${ROOT}/scripts/preview-beatlink.sh"
chmod +x "${ROOT}/scripts/install-desktop-shortcut.sh"

rm -rf "$APP"

if ! command -v osacompile >/dev/null 2>&1; then
  echo "osacompile not found — creating .command only"
else
  osacompile -o "$APP" <<EOF
on run
  do shell script "bash " & quoted form of "${ROOT}/scripts/open-beatlink.sh"
end run
EOF
  xattr -cr "$APP" 2>/dev/null || true
  echo "Created: $APP"
fi

cat > "$CMD" <<CMD
#!/bin/bash
exec "${ROOT}/scripts/open-beatlink.sh"
CMD
chmod +x "$CMD"
xattr -cr "$CMD" 2>/dev/null || true

cat > "$PREVIEW_CMD" <<PREVIEW
#!/bin/bash
cd "${ROOT}"
exec "${ROOT}/scripts/preview-beatlink.sh"
PREVIEW
chmod +x "$PREVIEW_CMD"
xattr -cr "$PREVIEW_CMD" 2>/dev/null || true

echo ""
echo "완료! 바탕화면에서 아래 중 하나를 더블클릭하세요:"
echo "  • BEATLINK.app (있으면) — Cursor + 개발 서버"
echo "  • BEATLINK 열기.command — Cursor + 개발 서버"
echo "  • BEATLINK 미리보기.command — 브라우저 http://localhost:5174"
echo ""
echo "처음에 막히면: 우클릭 → 열기 → 열기"
