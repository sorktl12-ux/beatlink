#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export GIT_SSH_COMMAND="ssh -i ${HOME}/.ssh/id_ed25519_beatlink -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new"

REMOTE="${1:-origin}"
BRANCH="${2:-main}"

if ! ssh -i "${HOME}/.ssh/id_ed25519_beatlink" -o IdentitiesOnly=yes -o BatchMode=yes -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
  echo "✗ GitHub SSH 인증 실패"
  echo ""
  echo "한 번만 설정하면 이후 자동 push가 됩니다:"
  echo "  1) https://github.com/settings/ssh/new 열기"
  echo "  2) Title: beatlink-deploy"
  echo "  3) Key에 아래 공개키 붙여넣기:"
  echo ""
  cat "${HOME}/.ssh/id_ed25519_beatlink.pub"
  echo ""
  exit 1
fi

git remote set-url "$REMOTE" "git@github.com:sorktl12-ux/beatlink.git" 2>/dev/null || true

echo "▶ Pushing to GitHub (${REMOTE}/${BRANCH})…"
git push -u "$REMOTE" "$BRANCH"

echo "✓ GitHub sync complete → https://github.com/sorktl12-ux/beatlink"
