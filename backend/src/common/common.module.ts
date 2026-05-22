import { Global, Module } from '@nestjs/common';
import { CloudWatchMetricsService } from './cloudwatch-metrics.service';

@Global()
@Module({
  providers: [CloudWatchMetricsService],
  exports: [CloudWatchMetricsService],
})
export class CommonModule {}
