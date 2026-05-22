#!/usr/bin/env bash
# Sync infrastructure/ssm/parameters.example.env → AWS SSM Parameter Store
set -euo pipefail

REGION="${AWS_REGION:-eu-north-1}"
PREFIX="/mini-jira/prod"
ENV_FILE="$(dirname "$0")/parameters.example.env"

if ! command -v aws >/dev/null; then
  echo "aws CLI required" >&2
  exit 1
fi

while IFS= read -r line || [ -n "$line" ]; do
  [[ -z "$line" || "$line" =~ ^# ]] && continue
  key="${line%%=*}"
  value="${line#*=}"
  name="${PREFIX}/${key}"
  param_type="String"
  if [[ "$key" == *SECRET* || "$key" == *PASSWORD* ]]; then
    param_type="SecureString"
  fi
  aws ssm put-parameter --region "$REGION" --name "$name" --value "$value" \
    --type "$param_type" --overwrite >/dev/null
  echo "Upserted $name ($param_type)"
done < "$ENV_FILE"

echo "Done. EC2 role must allow ssm:GetParametersByPath on ${PREFIX}/*"
