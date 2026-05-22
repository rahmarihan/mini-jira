# Mini-Jira AWS Operations Runbook

Region: **eu-north-1** | Account: **507210367772**

## Live endpoints

| Service | URL / ID |
|---------|----------|
| **CloudFront (public app)** | https://d3sty91ryq307z.cloudfront.net |
| **ALB DNS** | http://mini-jira-alb-74822711.eu-north-1.elb.amazonaws.com |
| **CloudWatch dashboard** | [mini-jira-notifications-dashboard](https://eu-north-1.console.aws.amazon.com/cloudwatch/home?region=eu-north-1#dashboards/dashboard/mini-jira-notifications-dashboard) |
| **Auto Scaling Group** | [mini-jira-asg](https://eu-north-1.console.aws.amazon.com/ec2/home?region=eu-north-1#AutoScalingGroupDetails:id=mini-jira-asg;view=details) |

---

## 1. EC2 instances (2 AZs, t2.micro)

**Expected:** 2× `t2.micro` in different AZs: `i-0cabde365d7a06081`, `i-0dbb8744f4376b3cb`.

```bash
aws ec2 describe-instances --region eu-north-1 \
  --instance-ids i-0cabde365d7a06081 i-0dbb8744f4376b3cb \
  --query 'Reservations[].Instances[].[InstanceId,State.Name,Placement.AvailabilityZone,InstanceType]' \
  --output table
```

Launch template must reference `infrastructure/ec2/user-data.sh` and instance profile **MiniJira-EC2-Role** (`arn:aws:iam::507210367772:role/MiniJira-EC2-Role`).

---

## 2. Auto Scaling Group (`mini-jira-asg`)

Verify:

- **Min / desired / max** capacity ≥ 2 for HA across AZs
- **Health check type:** `ELB` (not EC2-only) so unhealthy targets drain
- **Scaling policies:** CPU target tracking (e.g. scale out > 70% for 2 periods)
- **Instance refresh** after launch template update

```bash
aws autoscaling describe-auto-scaling-groups --region eu-north-1 \
  --auto-scaling-group-names mini-jira-asg \
  --query 'AutoScalingGroups[0].{AZs:AvailabilityZones,HC:HealthCheckType,Capacity:DesiredCapacity,Instances:Instances[*].InstanceId}'
```

---

## 3. Application Load Balancer

Confirm:

- Listener **443** → target group (SSL cert on ALB or ACM)
- Listener **80** → redirect to 443 (recommended)
- Target group health check: `HTTP:3000/` or `/` (Nest root returns `Hello World!`)
- **Cross-zone** load balancing enabled

```bash
aws elbv2 describe-target-health --region eu-north-1 \
  --target-group-arn "$(aws elbv2 describe-target-groups --region eu-north-1 --names mini-jira-tg --query 'TargetGroups[0].TargetGroupArn' --output text 2>/dev/null || echo '')"
```

Replace target group name if yours differs.

---

## 4. CloudFront → ALB

Origin should be the ALB DNS name with **HTTPS-only** to origin (or HTTP if TLS terminates at ALB only).

Checklist:

- Origin: `mini-jira-alb-74822711.eu-north-1.elb.amazonaws.com`
- Behaviors: `/api/*` or default → ALB; static assets → S3 if split-origin
- **Cache policy:** disable caching for `Authorization` / API paths
- **Alternate domain** + ACM cert (optional)
- Update frontend `NEXT_PUBLIC_API_URL` to `https://d3sty91ryq307z.cloudfront.net` (same-origin) or ALB path

---

## 5. User Data / NestJS bootstrap

1. Attach IAM policy from `infrastructure/iam/ec2-instance-policy.json` to **MiniJira-EC2-Role**
2. Sync secrets: `chmod +x infrastructure/ssm/sync-parameters.sh && ./infrastructure/ssm/sync-parameters.sh`
3. Paste `infrastructure/ec2/user-data.sh` into the ASG launch template (base64-encoded)
4. Rolling instance refresh; tail `/var/log/mini-jira-user-data.log` on new instances
5. Confirm API: `curl -s http://localhost:3000/` on instance → `Hello World!`

---

## 6. Secrets (SSM Parameter Store)

Path prefix: `/mini-jira/prod/*`

Do **not** commit production secrets. Use `infrastructure/ssm/parameters.example.env` as template.

EC2 user-data loads all parameters into `/etc/mini-jira.env` for PM2.

---

## 7. Monitoring

### Dashboard widgets

Deploy JSON (replace `REPLACE_*` placeholders in dashboard file with your ALB/TG/CloudFront IDs first):

```bash
chmod +x infrastructure/cloudwatch/deploy-monitoring.sh
./infrastructure/cloudwatch/deploy-monitoring.sh
```

Widgets cover: EC2 CPU, ALB health/requests, CloudFront errors, custom **MiniJira/Tasks** metrics, SNS publish counts, overdue count.

### Custom metrics (publish from app or Lambda)

| Metric | Namespace | Source |
|--------|-----------|--------|
| `TasksCreated` | MiniJira/Tasks | Nest on task create |
| `TasksClosed` | MiniJira/Tasks | Nest on status → DONE |
| `TimeToCloseSeconds` | MiniJira/Tasks | Audit log / task update |
| `OverdueTaskCount` | MiniJira/Tasks | Scheduled Lambda scan of `Mini-jira-Tasks` |

`daily-reminder-lambda` should publish `OverdueTaskCount` on each run.

### Alarm

`mini-jira-overdue-tasks-high` → SNS `daily-digest-topic` when `OverdueTaskCount` > 10 for 10 minutes.

Subscribe your email to the SNS topic in the console.

---

## 8. Related ARNs (quick reference)

See root [README.md](../README.md) for the full inventory.
