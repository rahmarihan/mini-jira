# CloudWatch dashboard — mini-jira-notifications-dashboard

**Console:** [mini-jira-notifications-dashboard (eu-north-1)](https://eu-north-1.console.aws.amazon.com/cloudwatch/home?region=eu-north-1#dashboards/dashboard/mini-jira-notifications-dashboard)

## Deploy widgets (CLI)

From repo root, with AWS CLI configured for account `507210367772`:

```bash
chmod +x infrastructure/cloudwatch/deploy-monitoring.sh
./infrastructure/cloudwatch/deploy-monitoring.sh
```

This runs `put-dashboard` with `dashboard-mini-jira-notifications.json`.

## EC2 widgets included

| Widget | Source |
|--------|--------|
| CPU Utilization | `AWS/EC2` per instance + ASG search |
| Status check failed | `AWS/EC2` instance + system checks |
| Network in / out | `AWS/EC2` both instances |
| Memory used % | `MiniJira/EC2` from CloudWatch agent (`user-data.sh`) |

EC2 default metrics appear within ~5 minutes of a running instance. Agent memory metrics require the CloudWatch agent on instances (installed by `infrastructure/ec2/user-data.sh`).

## Custom Mini-Jira task metrics

Namespace **`MiniJira/Tasks`** — published by Nest API when:

- `NODE_ENV=production`
- `CLOUDWATCH_METRICS_ENABLED=true`
- IAM role allows `cloudwatch:PutMetricData`

Create/close tasks in production to populate **Tasks created**, **Tasks closed**, **Time-to-close**.

## Manual deploy (console)

1. CloudWatch → Dashboards → **mini-jira-notifications-dashboard** → **Actions** → **View/edit source**.
2. Paste contents of `dashboard-mini-jira-notifications.json`.
3. **Save**.

## Add one EC2 widget by hand

1. **Edit dashboard** → **Add widget** → **Line**.
2. **Browse** → **EC2** → **Per-Instance Metrics** → **CPUUtilization**.
3. Select instance `i-0cabde365d7a06081` (repeat for second instance).
4. Statistic **Average**, Period **5 minutes** → **Create widget** → **Save dashboard**.
