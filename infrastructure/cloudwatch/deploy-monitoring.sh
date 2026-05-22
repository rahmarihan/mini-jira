#!/usr/bin/env bash
# Deploy / update CloudWatch dashboard and overdue-task alarm
set -euo pipefail

REGION="${AWS_REGION:-eu-north-1}"
DASHBOARD_NAME="${DASHBOARD_NAME:-mini-jira-notifications-dashboard}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Putting dashboard: $DASHBOARD_NAME"
aws cloudwatch put-dashboard \
  --region "$REGION" \
  --dashboard-name "$DASHBOARD_NAME" \
  --dashboard-body "file://${SCRIPT_DIR}/dashboard-mini-jira-notifications.json"

echo "Creating/updating alarm: mini-jira-overdue-tasks-high"
aws cloudwatch put-metric-alarm \
  --region "$REGION" \
  --cli-input-json "file://${SCRIPT_DIR}/alarm-overdue-tasks.json"

echo "Done. Console: https://${REGION}.console.aws.amazon.com/cloudwatch/home?region=${REGION}#dashboards/dashboard/${DASHBOARD_NAME}"
