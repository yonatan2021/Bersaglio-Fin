#!/usr/bin/env bash
# scripts/setup-branch-protection.sh
#
# Sets up branch protection rules for the `main` branch via the GitHub API.
# Requires: gh CLI (https://cli.github.com/) authenticated with repo permissions.
#
# Usage:
#   chmod +x scripts/setup-branch-protection.sh
#   ./scripts/setup-branch-protection.sh
#
# Required checks are the job names from ci.yml and pr.yml.
# GitHub records these after the first CI run — run this script AFTER
# your first CI run so GitHub knows the check names exist.

set -euo pipefail

REPO="yonatan2021/Bersaglio-Fin"
BRANCH="main"

echo "Setting up branch protection for ${REPO}:${BRANCH}..."

# The status check names must match exactly what GitHub shows in the "Checks" tab.
# Format: "<workflow-name> / <job-name>"
# These come from ci.yml and pr.yml jobs:
#   CI / Lint
#   CI / Type Check
#   CI / Test
#   PR Checks / Lint
#   PR Checks / Type Check
#   PR Checks / Test
#   PR Checks / PR Title (Conventional Commits)

gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  "/repos/${REPO}/branches/${BRANCH}/protection" \
  --input - <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "Lint",
      "Type Check",
      "Test",
      "PR Title (Conventional Commits)"
    ]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_linear_history": true
}
EOF

echo ""
echo "Branch protection applied to ${BRANCH}."
echo ""
echo "Rules set:"
echo "  required_status_checks  — all CI and PR checks must pass"
echo "  enforce_admins          — false (admins can bypass in emergencies)"
echo "  required_reviews        — 1 approving review, stale reviews dismissed"
echo "  restrictions            — null (no push restrictions beyond PR requirement)"
echo "  allow_force_pushes      — false"
echo "  allow_deletions         — false"
echo "  required_linear_history — true (squash or rebase only)"
echo ""
echo "Note: Run this script after your first CI run so GitHub recognizes the check names."
