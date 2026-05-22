#!/bin/bash
# Mini-Jira EC2 launch template user data — bootstraps NestJS on instance launch.
# Region: eu-north-1 | IAM instance profile: MiniJira-EC2-Role
set -euxo pipefail

REGION="${AWS_REGION:-eu-north-1}"
APP_DIR="/opt/mini-jira"
SSM_PREFIX="/mini-jira/prod"
REPO_URL="${MINI_JIRA_REPO_URL:https://github.com/rahmarihan/mini-jira.git}"
BRANCH="${MINI_JIRA_BRANCH:-master}"
NODE_MAJOR=20

exec > >(tee /var/log/mini-jira-user-data.log) 2>&1
echo "[user-data] Starting at $(date -u +%Y-%m-%dT%H:%M:%SZ)"

# --- Base packages ---
dnf update -y || yum update -y
dnf install -y git jq awscli nodejs npm amazon-cloudwatch-agent || \
  yum install -y git jq awscli nodejs npm amazon-cloudwatch-agent

# Node 20 via nvm (Amazon Linux 2023 base images may ship older node)
export NVM_DIR="/root/.nvm"
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
# shellcheck source=/dev/null
source "$NVM_DIR/nvm.sh"
nvm install "$NODE_MAJOR"
nvm alias default "$NODE_MAJOR"

npm install -g pm2

# --- Application directory ---
mkdir -p "$APP_DIR"
if [ ! -d "$APP_DIR/.git" ]; then
  git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR/backend"
npm ci --omit=dev
npm run build

# --- Environment from SSM Parameter Store (SecureString + String) ---
ENV_FILE="/etc/mini-jira.env"
: > "$ENV_FILE"
PARAMS=$(aws ssm get-parameters-by-path \
  --region "$REGION" \
  --path "$SSM_PREFIX" \
  --recursive \
  --with-decryption \
  --query 'Parameters[*].[Name,Value]' \
  --output text || true)

if [ -n "$PARAMS" ]; then
  while read -r name value; do
    key=$(basename "$name" | tr '[:lower:]' '[:upper:]')
    printf '%s=%q\n' "$key" "$value" >> "$ENV_FILE"
  done <<< "$PARAMS"
else
  echo "[user-data] WARN: No SSM parameters under ${SSM_PREFIX}; using defaults."
  cat >> "$ENV_FILE" <<'EOF'
AWS_REGION=eu-north-1
PORT=3000
HOST=0.0.0.0
DYNAMODB_FALLBACK_TO_MEMORY=false
COGNITO_USER_POOL_ID=eu-north-1_7kSYxgEr6
COGNITO_CLIENT_ID=mu4hog4jim74lhah2s4svbv41
EOF
fi

chmod 600 "$ENV_FILE"

# --- PM2 process manager (survives reboot) ---
set -a
# shellcheck source=/dev/null
source "$ENV_FILE"
set +a

pm2 delete mini-jira-api 2>/dev/null || true
pm2 start dist/main.js --name mini-jira-api --cwd "$APP_DIR/backend"
pm2 save
env PATH="$PATH:$NVM_DIR/versions/node/v${NODE_MAJOR}.*/bin" pm2 startup systemd -u root --hp /root
systemctl enable pm2-root || true

# --- CloudWatch Agent (EC2 CPU → dashboard) ---
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<'CW'
{
  "metrics": {
    "namespace": "MiniJira/EC2",
    "metrics_collected": {
      "cpu": {
        "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
        "metrics_collection_interval": 60,
        "totalcpu": true
      },
      "mem": {
        "measurement": ["mem_used_percent"],
        "metrics_collection_interval": 60
      }
    }
  }
}
CW
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s

echo "[user-data] Complete — API listening on port ${PORT:-3000}"
