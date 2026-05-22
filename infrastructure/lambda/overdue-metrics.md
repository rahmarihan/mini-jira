# Overdue task metric for CloudWatch alarm

Alarm `mini-jira-overdue-tasks-high` watches **`MiniJira/Tasks` → `OverdueTaskCount`**.

## Option A — extend `daily-reminder-lambda`

After scanning `Mini-jira-Tasks`, publish:

```javascript
const { CloudWatchClient, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');
const overdue = tasks.filter(t => t.status !== 'DONE' && new Date(t.deadline) < new Date()).length;

await cloudwatch.send(new PutMetricDataCommand({
  Namespace: 'MiniJira/Tasks',
  MetricData: [{ MetricName: 'OverdueTaskCount', Value: overdue, Unit: 'Count' }],
}));
```

## Option B — NestJS scheduled job (future)

Call `CloudWatchMetricsService.overdueTaskCount(n)` from a cron in the API after a DynamoDB scan (manager-only internal job).

The API already publishes `TasksCreated`, `TasksClosed`, and `TimeToCloseSeconds` when `NODE_ENV=production`.
