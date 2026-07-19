#!/usr/bin/env bash
# Cuts a release: infers the version bump from Conventional Commits since
# the last tag (fix -> patch, feat -> minor, "BREAKING CHANGE"/"!" -> major
# via commit-and-tag-version), updates CHANGELOG.md, commits, tags "vX.Y.Z",
# and pushes. See "Cutting a release" in README.md.
set -euo pipefail

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

# commit-and-tag-version always proposes at least a patch bump, even with
# zero commits since the last tag — that's not "nothing to release", so
# guard for it ourselves.
last_tag="$(git describe --tags --abbrev=0 --match 'v*' 2>/dev/null || true)"
if [[ -n "$last_tag" ]] && [[ "$(git rev-list "${last_tag}..HEAD" --count)" -eq 0 ]]; then
  echo "No commits since ${last_tag}. Nothing to release." >&2
  exit 1
fi

pnpm typecheck
pnpm test

pnpm exec commit-and-tag-version

new_version="$(node -p "require('./package.json').version")"
tag="v${new_version}"

git push origin main
git push origin "$tag"

echo ""
echo "Pushed ${tag}. release.yml will build and publish installers to:"
echo "  https://github.com/pierreozoux/recipes-m/releases/tag/${tag}"
