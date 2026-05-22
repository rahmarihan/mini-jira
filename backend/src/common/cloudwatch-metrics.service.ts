import { Injectable, Logger } from '@nestjs/common';
import {
  CloudWatchClient,
  PutMetricDataCommand,
  type MetricDatum,
} from '@aws-sdk/client-cloudwatch';

const NAMESPACE = 'MiniJira/Tasks';

@Injectable()
export class CloudWatchMetricsService {
  private readonly logger = new Logger(CloudWatchMetricsService.name);
  private readonly client: CloudWatchClient | null;
  private readonly enabled: boolean;

  constructor() {
    this.enabled =
      process.env.NODE_ENV === 'production' &&
      process.env.CLOUDWATCH_METRICS_ENABLED !== 'false';
    this.client = this.enabled
      ? new CloudWatchClient({
          region: process.env.AWS_REGION || 'eu-north-1',
        })
      : null;
  }

  private async put(data: MetricDatum[]) {
    if (!this.client || data.length === 0) return;
    try {
      await this.client.send(
        new PutMetricDataCommand({ Namespace: NAMESPACE, MetricData: data }),
      );
    } catch (error) {
      this.logger.warn(`PutMetricData failed: ${String(error)}`);
    }
  }

  async taskCreated(teamId?: string) {
    await this.put([
      {
        MetricName: 'TasksCreated',
        Value: 1,
        Unit: 'Count',
        Dimensions: teamId ? [{ Name: 'TeamId', Value: teamId }] : undefined,
      },
    ]);
  }

  async taskClosed(teamId: string, timeToCloseSeconds?: number) {
    const data: MetricDatum[] = [
      {
        MetricName: 'TasksClosed',
        Value: 1,
        Unit: 'Count',
        Dimensions: [{ Name: 'TeamId', Value: teamId }],
      },
    ];
    if (timeToCloseSeconds != null && timeToCloseSeconds >= 0) {
      data.push({
        MetricName: 'TimeToCloseSeconds',
        Value: timeToCloseSeconds,
        Unit: 'Seconds',
        Dimensions: [{ Name: 'TeamId', Value: teamId }],
      });
    }
    await this.put(data);
  }

  async overdueTaskCount(count: number) {
    await this.put([
      {
        MetricName: 'OverdueTaskCount',
        Value: count,
        Unit: 'Count',
      },
    ]);
  }
}
