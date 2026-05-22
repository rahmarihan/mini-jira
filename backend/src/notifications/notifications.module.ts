import { Module } from '@nestjs/common';
import { DynamoModule } from '../dynamo/dynamo.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [DynamoModule],
  controllers: [NotificationsController, ReportsController],
  providers: [NotificationsService, ReportsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}