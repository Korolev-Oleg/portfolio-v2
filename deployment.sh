#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$repo_root"

command -v gh >/dev/null 2>&1 || {
  echo "GitHub CLI (gh) is required."
  exit 1
}

command -v npm >/dev/null 2>&1 || {
  echo "npm is required."
  exit 1
}

# Verify GitHub authentication.
gh auth status --active --hostname github.com >/dev/null

# Configure git authentication through GitHub CLI.
gh auth setup-git --hostname github.com

# Resolve repository from the current checkout.
repo="$(gh repo view --json nameWithOwner --jq '.nameWithOwner')"
ssh_url="$(gh repo view --json sshUrl --jq '.sshUrl')"

echo "Deploying $repo"

npm ci
npm run build

deploy_dir="$(mktemp -d)"

cleanup() {
  git worktree remove --force "$deploy_dir" >/dev/null 2>&1 || true
  rm -rf "$deploy_dir" >/dev/null 2>&1 || true
}

trap cleanup EXIT

# Ensure origin uses SSH.
git remote set-url origin "$ssh_url"

# Fetch existing gh-pages if present.
git fetch origin gh-pages 2>/dev/null || true

if git show-ref --verify --quiet refs/remotes/origin/gh-pages; then
  git worktree add --detach "$deploy_dir" origin/gh-pages
else
  # Create an orphan deployment worktree from the current commit.
  git worktree add --detach "$deploy_dir" HEAD

  git -C "$deploy_dir" checkout --orphan gh-pages
  git -C "$deploy_dir" rm -rf . >/dev/null 2>&1 || true
fi

# Remove previous deployment files while preserving worktree metadata.
find "$deploy_dir" \
  -mindepth 1 \
  -maxdepth 1 \
  ! -name .git \
  -exec rm -rf {} +

cp -R dist/. "$deploy_dir"/

# Prevent GitHub Pages/Jekyll processing.
touch "$deploy_dir/.nojekyll"

git -C "$deploy_dir" add --all

if git -C "$deploy_dir" diff --cached --quiet; then
  echo "No deployment changes."
  exit 0
fi

git -C "$deploy_dir" commit \
  -m "deploy: update gh-pages"

git -C "$deploy_dir" push \
  "$ssh_url" \
  HEAD:gh-pages \
  --force-with-lease

echo
echo "Deployment complete:"
echo "  repo:   $repo"
echo "  branch: gh-pages"
