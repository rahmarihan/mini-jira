#!/usr/bin/env bash
# M5 — Wrapper: runs canonical script with Mini-jira-* table names
# Usage: AWS_REGION=eu-north-1 ./infrastructure/dynamodb/create-tables.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
exec "$ROOT/backend/scripts/create-tables.sh" "$@"
