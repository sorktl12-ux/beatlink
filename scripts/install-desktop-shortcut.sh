#!/usr/bin/env bash
# Creates desktop shortcuts — double-click to open BEATLINK in Cursor.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DESKTOP="${HOME}/Desktop"
APP="${DESKTOP}/BEATLINK.app"
CMD="${DESKTOP}/BEATLINK 열기.command"
PREVIEW_CMD="${DESKTOP}/BEATLINK 미리보기.command"
OPEN_SCRIPT="${ROOT}/scripts/open-beatlink.sh"
PREVIEW_SCRIPT="${ROOT}/scripts/preview-beatlink.sh"

chmod +x "$OPEN_SCRIPT"
chmod +x "$PREVIEW_SCRIPT"

# Remove broken hand-made app bundle
rm -rf "$APP"

# AppleScript app — macOS accepts this better than unsigned shell .app bundles
osacompile -o "$APP" <<EOF
on run
  set projectPath to "${ROOT}"
  set openScript to "${ROOT}/scripts/open-beatlink.sh"
  try
    do shell script "bash " & quoted form of openScript
  on error errMsg number errNum
    display dialog "BEATLINK를 열 수 없습니다." & return & return & errMsg buttons {"확인"} default button 1 with icon caution
  end try
end run
EOF

# Fallback: .command file (always works; Terminal opens briefly)
cat > "$CMD" <<CMD
#!/bin/bash
exec "${OPEN_SCRIPT}"
CMD
chmod +x "$CMD"

# Site preview — dev server + browser
cat > "$PREVIEW_CMD" <<PREVIEW
#!/bin/bash
cd "${ROOT}"
exec "${PREVIEW_SCRIPT}"
PREVIEW
chmod +x "$PREVIEW_CMD"

# Remove quarantine / extended attributes that block launch
xattr -cr "$APP" 2>/dev/null || true
xattr -cr "$CMD" 2>/dev/null || true
xattr -cr "$PREVIEW_CMD" 2>/dev/null || true

echo "✓ 바탕화면 바로가기를 만들었습니다."
echo "  • BEATLINK.app              — Cursor + 개발 서버 (채팅 옆 미리보기용)"
echo "  • BEATLINK 열기.command     — 위와 동일 (안 될 때)"
echo "  • BEATLINK 미리보기.command — 브라우저에서 http://localhost:5174"
echo "  → ${ROOT}"
