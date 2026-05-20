#!/usr/bin/env bash
# M5 — Delete all Mini-Jira DynamoDB tables (dev/teardown only)

set -euo pipefail

REGION="${AWS_REGION:-eu-north-1}"
export AWS_DEFAULT_REGION="$REGION"

TABLES=(
  "${DYNAMODB_USERS_TABLE:-Mini-jira-Users}"
  "${DYNAMODB_TEAMS_TABLE:-Mini-jira-Teams}"
  "${DYNAMODB_TASKS_TABLE:-Mini-jira-Tasks}"
  "${DYNAMODB_PROJECTS_TABLE:-Mini-jira-Projects}"
  "${DYNAMODB_AUDIT_LOG_TABLE:-Mini-jira-AuditLog}"
  "${DYNAMODB_COMMENTS_TABLE:-Mini-jira-Comments}"
  "${DYNAMODB_NOTIFICATIONS_TABLE:-Mini-jira-Notifications}"
)

echo "Deleting DynamoDB tables in region: $REGION"

for name in "${TABLES[@]}"; do
  if aws dynamodb describe-table --table-name "$name" &>/dev/null; then
    echo "  → Deleting $name..."
    aws dynamodb delete-table --table-name "$name" >/dev/null
    aws dynamodb wait table-not-exists --table-name "$name"
    echo "  ✓ $name deleted"
  else
    echo "  - $name not found — skipping"
  fi
done

echo "Done."
