#!/usr/bin/env bash
# Read-only checks for Mini-Jira AWS footprint (eu-north-1)
set -euo pipefail

REGION="${AWS_REGION:-eu-north-1}"
ASG_NAME="mini-jira-asg"
INSTANCES=("i-0cabde365d7a06081" "i-0dbb8744f4376b3cb")
ALB_DNS="mini-jira-alb-74822711.eu-north-1.elb.amazonaws.com"
CF_URL="https://d3sty91ryq307z.cloudfront.net"

echo "=== EC2 instances ==="
aws ec2 describe-instances --region "$REGION" --instance-ids "${INSTANCES[@]}" \
  --query 'Reservations[].Instances[].[InstanceId,State.Name,Placement.AvailabilityZone,InstanceType]' \
  --output table 2>/dev/null || echo "WARN: Could not describe instances (check AWS credentials)"

echo ""
echo "=== Auto Scaling Group: $ASG_NAME ==="
aws autoscaling describe-auto-scaling-groups --region "$REGION" \
  --auto-scaling-group-names "$ASG_NAME" \
  --query 'AutoScalingGroups[0].{Desired:DesiredCapacity,Min:MinSize,Max:MaxSize,HC:HealthCheckType,Instances:Instances[*].[InstanceId,LifecycleState,HealthStatus]}' \
  --output yaml 2>/dev/null || echo "WARN: ASG not found"

echo ""
echo "=== ALB health (curl) ==="
curl -sf -o /dev/null -w "ALB HTTP %{http_code}\n" "http://${ALB_DNS}/" 2>/dev/null || echo "ALB unreachable from this host"

echo ""
echo "=== CloudFront (curl) ==="
curl -sf -o /dev/null -w "CloudFront HTTP %{http_code}\n" "$CF_URL/" 2>/dev/null || echo "CloudFront unreachable from this host"

echo ""
echo "=== SSM parameters (/mini-jira/prod) ==="
aws ssm get-parameters-by-path --region "$REGION" --path /mini-jira/prod --recursive \
  --query 'Parameters[].Name' --output table 2>/dev/null || echo "WARN: No SSM params or no access"

echo ""
echo "=== CloudWatch dashboard ==="
aws cloudwatch list-dashboards --region "$REGION" \
  --query "DashboardEntries[?DashboardName=='mini-jira-notifications-dashboard'].[DashboardName,LastModified]" \
  --output table 2>/dev/null || true

echo "Done."
