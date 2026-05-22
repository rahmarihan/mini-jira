// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { ConfigModule } from '@nestjs/config';
import { awsConfig } from '../config/aws.config';
import { cognitoConfig } from '../config/cognito.config';
import { validate } from '../config/env.validation';
import { DynamoModule } from './dynamo/dynamo.module';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { ProjectsModule } from './projects/projects.module';
import { CommentsModule } from './comments/comments.module';
import { FilesModule } from './files/files.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { UsersModule } from './users/users.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [awsConfig, cognitoConfig],
      validate,
    }),
    CommonModule,
    DynamoModule,
    AuthModule,
    TasksModule,
    ProjectsModule,
    CommentsModule,
    FilesModule,
    NotificationsModule,
    AuditLogModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
