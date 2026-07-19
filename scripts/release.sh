#!/usr/bin/env bash
# Cuts a release: bumps package.json, commits, tags, and pushes.
# See "Cutting a release" in README.md for the full explanation.
set -euo pipefail

bump="${1:-}"
case "$bump" in
  patch|minor|major) ;;
  *)
    echo "Usage: $0 <patch|minor|major>" >&2
    exit 1
    ;;
esac

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree is not clean. Commit or stash changes first." >&2
  exit 1
fi

branch="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$branch" != "main" ]]; then
  echo "Must be on main (currently on $branch)." >&2
  exit 1
fi

git fetch origin main
if [[ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]]; then
  echo "main is behind origin/main. Run 'git pull' first." >&2
  exit 1
fi

pnpm typecheck
pnpm test

# --no-git-tag-version: bump package.json only. We commit and tag
# ourselves so the tag always gets the "v" prefix release.yml's trigger
# (tags: ['v*']) requires, regardless of any local tag-version-prefix
# config, and so the tag is guaranteed to point at the commit it
# actually describes (see README - a prior release's tag drifted from
# the commit that was actually built and published under it).
pnpm version "$bump" --no-git-tag-version
new_version="$(node -p "require('./package.json').version")"
tag="v${new_version}"

git add package.json
git commit -m "Release ${tag}"
git tag -a "$tag" -m "$tag"

git push origin main
git push origin "$tag"

echo ""
echo "Pushed ${tag}. release.yml will build and publish installers to:"
echo "  https://github.com/pierreozoux/recipes-m/releases/tag/${tag}"
