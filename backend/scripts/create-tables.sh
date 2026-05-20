#!/usr/bin/env bash
# M5 — Create DynamoDB tables (names match backend/.env.example & M1 env.validation)
#
# Usage:
#   chmod +x backend/scripts/create-tables.sh
#   AWS_REGION=eu-north-1 ./backend/scripts/create-tables.sh

set -euo pipefail

REGION="${AWS_REGION:-eu-north-1}"
export AWS_DEFAULT_REGION="$REGION"

USERS_TABLE="${DYNAMODB_USERS_TABLE:-Mini-jira-Users}"
TEAMS_TABLE="${DYNAMODB_TEAMS_TABLE:-Mini-jira-Teams}"
TASKS_TABLE="${DYNAMODB_TASKS_TABLE:-Mini-jira-Tasks}"
PROJECTS_TABLE="${DYNAMODB_PROJECTS_TABLE:-Mini-jira-Projects}"
AUDIT_TABLE="${DYNAMODB_AUDIT_LOG_TABLE:-Mini-jira-AuditLog}"
COMMENTS_TABLE="${DYNAMODB_COMMENTS_TABLE:-Mini-jira-Comments}"
NOTIFICATIONS_TABLE="${DYNAMODB_NOTIFICATIONS_TABLE:-Mini-jira-Notifications}"

echo "Creating DynamoDB tables in region: $REGION"

create_table() {
  local name="$1"
  shift
  if aws dynamodb describe-table --table-name "$name" &>/dev/null; then
    echo "  ✓ $name already exists — skipping"
    return 0
  fi
  echo "  → Creating $name..."
  aws dynamodb create-table --table-name "$name" "$@" --billing-mode PAY_PER_REQUEST >/dev/null
  aws dynamodb wait table-exists --table-name "$name"
  echo "  ✓ $name ready"
}

# M1 — Users
create_table "$USERS_TABLE" \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=email,AttributeType=S \
  --key-schema AttributeName=userId,KeyType=HASH \
  --global-secondary-indexes "[
    {
      \"IndexName\": \"email-index\",
      \"KeySchema\": [{\"AttributeName\": \"email\", \"KeyType\": \"HASH\"}],
      \"Projection\": {\"ProjectionType\": \"ALL\"}
    }
  ]"

# M1 — Teams
create_table "$TEAMS_TABLE" \
  --attribute-definitions AttributeName=teamId,AttributeType=S \
  --key-schema AttributeName=teamId,KeyType=HASH

# M2 — Tasks
create_table "$TASKS_TABLE" \
  --attribute-definitions \
    AttributeName=taskId,AttributeType=S \
    AttributeName=teamId,AttributeType=S \
    AttributeName=assigneeId,AttributeType=S \
  --key-schema AttributeName=taskId,KeyType=HASH \
  --global-secondary-indexes "[
    {
      \"IndexName\": \"teamId-index\",
      \"KeySchema\": [{\"AttributeName\": \"teamId\", \"KeyType\": \"HASH\"}],
      \"Projection\": {\"ProjectionType\": \"ALL\"}
    },
    {
      \"IndexName\": \"assigneeId-index\",
      \"KeySchema\": [{\"AttributeName\": \"assigneeId\", \"KeyType\": \"HASH\"}],
      \"Projection\": {\"ProjectionType\": \"ALL\"}
    }
  ]"

# M2 — Projects
create_table "$PROJECTS_TABLE" \
  --attribute-definitions AttributeName=projectId,AttributeType=S \
  --key-schema AttributeName=projectId,KeyType=HASH

# M2 — Audit log
create_table "$AUDIT_TABLE" \
  --attribute-definitions \
    AttributeName=logId,AttributeType=S \
    AttributeName=taskId,AttributeType=S \
  --key-schema AttributeName=logId,KeyType=HASH \
  --global-secondary-indexes "[
    {
      \"IndexName\": \"taskId-index\",
      \"KeySchema\": [{\"AttributeName\": \"taskId\", \"KeyType\": \"HASH\"}],
      \"Projection\": {\"ProjectionType\": \"ALL\"}
    }
  ]"

# M3 — Comments (optional; included for full stack)
create_table "$COMMENTS_TABLE" \
  --attribute-definitions \
    AttributeName=commentId,AttributeType=S \
    AttributeName=taskId,AttributeType=S \
  --key-schema AttributeName=commentId,KeyType=HASH \
  --global-secondary-indexes "[
    {
      \"IndexName\": \"taskId-index\",
      \"KeySchema\": [{\"AttributeName\": \"taskId\", \"KeyType\": \"HASH\"}],
      \"Projection\": {\"ProjectionType\": \"ALL\"}
    }
  ]"

# M4 — Notifications (optional; included for full stack)
create_table "$NOTIFICATIONS_TABLE" \
  --attribute-definitions \
    AttributeName=notificationId,AttributeType=S \
    AttributeName=userId,AttributeType=S \
  --key-schema AttributeName=notificationId,KeyType=HASH \
  --global-secondary-indexes "[
    {
      \"IndexName\": \"userId-index\",
      \"KeySchema\": [{\"AttributeName\": \"userId\", \"KeyType\": \"HASH\"}],
      \"Projection\": {\"ProjectionType\": \"ALL\"}
    }
  ]"

echo ""
echo "All tables created (or already present)."
aws dynamodb list-tables --output table
