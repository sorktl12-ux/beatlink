#!/usr/bin/env bash
# Opens BeatLink in Cursor and starts the dev server for in-editor preview.
set -euo pipefail

PROJECT="${BEATLINK_ROOT:-$HOME/beatlink}"
PREVIEW_SCRIPT="${PROJECT}/scripts/preview-beatlink.sh"

if [[ ! -d "$PROJECT" ]]; then
  osascript <<EOF 2>/dev/null || true
display dialog "BEATLINK 폴더를 찾을 수 없습니다.

$PROJECT" buttons {"확인"} default button 1 with icon caution
EOF
  echo "ERROR: folder not found: $PROJECT" >&2
  exit 1
fi

if [[ -d "/Applications/Cursor.app" ]]; then
  open -a "Cursor" "$PROJECT"
elif command -v cursor >/dev/null 2>&1; then
  cursor "$PROJECT"
else
  osascript <<EOF 2>/dev/null || true
display dialog "Cursor가 설치되어 있지 않습니다.

https://cursor.com 에서 설치해 주세요." buttons {"확인"} default button 1 with icon caution
EOF
  echo "ERROR: Cursor not found" >&2
  exit 1
fi

if [[ -x "$PREVIEW_SCRIPT" ]]; then
  bash "$PREVIEW_SCRIPT" --no-browser
fi

# Open in-editor preview beside chat (Simple Browser)
sleep 1
if [[ -d "/Applications/Cursor.app" ]]; then
  open "cursor://vscode/simple-browser/show?url=http://localhost:5174" 2>/dev/null || true
fi
