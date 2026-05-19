// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { DynamoModule } from './dynamo/dynamo.module';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { ProjectsModule } from './projects/projects.module';
import { CommentsModule } from './comments/comments.module';
import { FilesModule } from './files/files.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    DynamoModule,
    AuthModule,
    TasksModule,
    ProjectsModule,
    CommentsModule,
    FilesModule,
    NotificationsModule,
    AuditLogModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}