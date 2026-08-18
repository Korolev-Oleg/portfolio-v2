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

command -v git >/dev/null 2>&1 || {
  echo "git is required."
  exit 1
}

# Verify GitHub authentication.
gh auth status --active --hostname github.com >/dev/null

# Resolve repository from the current checkout.
repo="$(gh repo view --json nameWithOwner --jq '.nameWithOwner')"
remote="$(gh repo view --json sshUrl --jq '.sshUrl')"

echo "Deploying $repo"
echo "Remote: $remote"

# Build CURRENT checkout / branch.
npm ci
npm run build

if [[ ! -d dist ]]; then
  echo "dist/ was not generated."
  exit 1
fi

deploy_dir="$(mktemp -d)"

cleanup() {
  git worktree remove --force "$deploy_dir" >/dev/null 2>&1 || true
  rm -rf "$deploy_dir" >/dev/null 2>&1 || true
}

trap cleanup EXIT

#
# Read gh-pages directly from GitHub.
# Do not rely on origin/gh-pages for lease safety.
#
remote_sha="$(
  git ls-remote "$remote" refs/heads/gh-pages |
  awk '{print $1}'
)"

if [[ -n "$remote_sha" ]]; then
  echo "Current gh-pages: $remote_sha"

  # Fetch the exact commit we just observed.
  git fetch --quiet "$remote" "$remote_sha"

  # Build deployment worktree from current remote gh-pages.
  git worktree add --detach "$deploy_dir" "$remote_sha"
else
  echo "gh-pages does not exist yet."

  # Start from current HEAD only so Git can create a worktree,
  # then immediately replace its history with an orphan branch.
  git worktree add --detach "$deploy_dir" HEAD

  git -C "$deploy_dir" checkout --orphan gh-pages
  git -C "$deploy_dir" rm -rf . >/dev/null 2>&1 || true
fi

#
# Replace deployment contents with dist/.
#
find "$deploy_dir" \
  -mindepth 1 \
  -maxdepth 1 \
  ! -name .git \
  -exec rm -rf {} +

cp -R dist/. "$deploy_dir"/

# Disable Jekyll processing.
touch "$deploy_dir/.nojekyll"

git -C "$deploy_dir" add --all

if git -C "$deploy_dir" diff --cached --quiet; then
  echo "No deployment changes."
  exit 0
fi

git -C "$deploy_dir" commit \
  -m "deploy: update gh-pages"

#
# Push using an EXPLICIT lease.
#
# This is the important long-term fix.
#
if [[ -n "$remote_sha" ]]; then
  echo "Pushing with lease against: $remote_sha"

  git -C "$deploy_dir" push \
    "$remote" \
    HEAD:refs/heads/gh-pages \
    --force-with-lease="refs/heads/gh-pages:$remote_sha"
else
  echo "Creating gh-pages"

  git -C "$deploy_dir" push \
    "$remote" \
    HEAD:refs/heads/gh-pages \
    --force-with-lease="refs/heads/gh-pages:"
fi

echo
echo "Deployment complete:"
echo "  repo:   $repo"
echo "  branch: gh-pages"
