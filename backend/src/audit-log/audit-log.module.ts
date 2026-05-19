// backend/src/audit-log/audit-log.module.ts
import { Module } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { DynamoModule } from '../dynamo/dynamo.module';

@Module({
  imports: [DynamoModule],
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class AuditLogModule {}