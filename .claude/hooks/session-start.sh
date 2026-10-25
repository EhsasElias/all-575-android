#!/bin/bash
# Installs what the tests, linter and type checker need when a Claude Code cloud session starts.
set -euo pipefail

# Only in Claude Code cloud sessions: on a developer's machine nothing is installed behind their back.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}"

# `npm ci`, not `npm install`: it installs exactly what package-lock.json says and never rewrites it, so a new session
# starts with a clean working tree (a rewritten lockfile would look like an uncommitted change).
npm ci --no-audit --no-fund
