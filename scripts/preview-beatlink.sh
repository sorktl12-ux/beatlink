#!/usr/bin/env bash
# Local site preview — starts BeatLink Vite dev server and opens the browser.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PORT="${BEATLINK_DEV_PORT:-5174}"
URL="http://localhost:${PORT}"
LOG="${TMPDIR:-/tmp}/beatlink-dev.log"
PID_FILE="${TMPDIR:-/tmp}/beatlink-dev.pid"
OPEN_BROWSER=1

for arg in "$@"; do
  case "$arg" in
    --no-browser) OPEN_BROWSER=0 ;;
  esac
done

is_beatlink_server() {
  local pid
  pid="$(lsof -iTCP:"${PORT}" -sTCP:LISTEN -t 2>/dev/null | head -1 || true)"
  [[ -n "$pid" ]] || return 1
  ps -p "$pid" -o args= 2>/dev/null | grep -q "$ROOT"
}

notify() {
  osascript <<EOF 2>/dev/null || true
display dialog "$1" buttons {"확인"} default button 1 with icon caution
EOF
}

start_server() {
  if is_beatlink_server; then
    return 0
  fi

  if lsof -iTCP:"${PORT}" -sTCP:LISTEN -t >/dev/null 2>&1; then
    notify "포트 ${PORT}이(가) 다른 프로그램에서 사용 중입니다.

BeatLink 전용 포트(5174)를 비워 주세요."
    echo "ERROR: port ${PORT} in use by another process" >&2
    exit 1
  fi

  if [[ ! -d node_modules ]]; then
    echo "▶ Installing dependencies…"
    npm install
  fi

  echo "▶ Starting BeatLink dev server on ${URL}…"
  nohup npm run dev >>"$LOG" 2>&1 &
  echo $! >"$PID_FILE"

  for _ in $(seq 1 60); do
    if curl -sf "$URL" >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.25
  done

  notify "개발 서버를 시작하지 못했습니다.

로그: ${LOG}"
  echo "ERROR: dev server did not start. See ${LOG}" >&2
  exit 1
}

start_server

if [[ "$OPEN_BROWSER" == "1" ]]; then
  open "$URL"
fi

echo "✓ BeatLink 미리보기: ${URL}"
echo "  Cursor: 채팅 옆 미리보기 → Cmd+Shift+P → Simple Browser: Show → ${URL}"
echo "  배포: npm run deploy"
echo "  로그: ${LOG}"
