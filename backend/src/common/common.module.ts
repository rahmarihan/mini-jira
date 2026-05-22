import { Global, Module } from '@nestjs/common';
import { CloudWatchMetricsService } from './cloudwatch-metrics.service';
import { RolesGuard } from './guards/roles.guard';

@Global()
@Module({
  providers: [CloudWatchMetricsService, RolesGuard],
  exports: [CloudWatchMetricsService, RolesGuard],
})
export class CommonModule {}
