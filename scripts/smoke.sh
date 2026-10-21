#!/usr/bin/env bash
# Production smoke checks for RTO Leak — read-only, no dependencies beyond
# curl and grep (both preinstalled on GitHub-hosted runners).
#
# Usage: scripts/smoke.sh [BASE_URL]
#   BASE_URL defaults to the production deployment.
#
# What it checks (first-party routes only — third-party source links are
# deliberately NOT checked here, so an unrelated site's outage can never
# fail this job):
#   /                                        -> 200, title + bundle markers
#   /guides/how-to-calculate-rto-costs      -> 200, article H1 marker
#   /guides/how-to-calculate-rto-rate       -> 200, article H1 marker
#   /sitemap.xml                             -> 200, both guide URLs present
#   /robots.txt                              -> 200, sitemap reference present
#   /guides/does-not-exist-xyz              -> 404 (unknown slugs stay 404)
#   HSTS header present on the homepage (security-header regression guard)
#
# Transient network failures are retried (3 attempts, 5s apart) so a single
# blip does not fail the job. Any failed check exits non-zero.
set -u

BASE_URL="${1:-https://rto-leak-18j6.vercel.app}"
BASE_URL="${BASE_URL%/}"
TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT
FAILURES=0

# fetch <path> <outfile>: sets FETCH_CODE to the HTTP status (empty on
# total network failure) and returns 0 on any HTTP response, 1 otherwise.
# NOTE: the status is returned via the FETCH_CODE global, not stdout —
# returning it through command substitution would run fetch in a subshell
# and lose the failure accounting in the calling shell.
# Retries only on curl-level failure (network/DNS/timeout), never on a
# received HTTP status — a real 404 or 500 must fail fast, not be retried
# into a pass.
FETCH_CODE=""
fetch() {
  local path="$1" out="$2" attempt=1
  FETCH_CODE=""
  while [ "$attempt" -le 3 ]; do
    if FETCH_CODE="$(curl -sS --max-time 30 -o "$out" -w '%{http_code}' "$BASE_URL$path" 2>/dev/null)"; then
      return 0
    fi
    echo "  (network retry $attempt/3 for $path)"
    attempt=$((attempt + 1))
    sleep 5
  done
  echo "FAIL: $path — no HTTP response after 3 attempts"
  return 1
}

# check <path> <expected-status> [marker ...]
check() {
  local path="$1" expected="$2"
  shift 2
  local body="$TMPDIR/body"
  if ! fetch "$path" "$body"; then
    FAILURES=$((FAILURES + 1))
    return 0
  fi
  local code="$FETCH_CODE"
  if [ "$code" != "$expected" ]; then
    echo "FAIL: $path — expected HTTP $expected, got $code"
    FAILURES=$((FAILURES + 1))
    return 0
  fi
  local marker
  for marker in "$@"; do
    if ! grep -qF "$marker" "$body"; then
      echo "FAIL: $path — marker missing: $marker"
      FAILURES=$((FAILURES + 1))
      return 0
    fi
  done
  echo "PASS: $path -> $expected"
}

check "/" 200 "RTO Leak" "/assets/" "How much is RTO costing you?" "guides/how-to-calculate-rto-costs" "guides/how-to-calculate-rto-rate"
check "/guides/how-to-calculate-rto-costs" 200 "How to Calculate RTO Costs for an Indian D2C Brand"
check "/guides/how-to-calculate-rto-rate" 200 "How to Calculate RTO Rate for an Indian Ecommerce Brand"
check "/sitemap.xml" 200 "guides/how-to-calculate-rto-costs" "guides/how-to-calculate-rto-rate"
check "/robots.txt" 200 "Sitemap:"
check "/guides/does-not-exist-xyz" 404

# Security-header regression guard (HSTS is supplied by Vercel + vercel.json
# headers; if it disappears, something changed in deployment config).
if curl -sSI --max-time 30 "$BASE_URL/" | grep -qi "strict-transport-security"; then
  echo "PASS: HSTS header present on /"
else
  echo "FAIL: HSTS header missing on /"
  FAILURES=$((FAILURES + 1))
fi

echo "---"
if [ "$FAILURES" -gt 0 ]; then
  echo "SMOKE FAILED: $FAILURES check(s) failed against $BASE_URL"
  exit 1
fi
echo "SMOKE OK: all checks passed against $BASE_URL"
