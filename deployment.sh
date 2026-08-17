#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$repo_root"

npm ci
npm run build

deploy_dir="$(mktemp -d)"
cleanup() {
  git worktree remove --force "$deploy_dir" >/dev/null 2>&1 || true
}
trap cleanup EXIT

git fetch origin gh-pages || true
if git show-ref --verify --quiet refs/remotes/origin/gh-pages; then
  git worktree add --detach "$deploy_dir" origin/gh-pages
else
  git worktree add --detach "$deploy_dir" HEAD
fi

find "$deploy_dir" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -R dist/. "$deploy_dir"/
git -C "$deploy_dir" add --all

if git -C "$deploy_dir" diff --cached --quiet; then
  echo "No deployment changes."
  exit 0
fi

git -C "$deploy_dir" commit -m 'update gh-pages'
git -C "$deploy_dir" push origin HEAD:gh-pages --force-with-lease
echo "Deployment complete."
