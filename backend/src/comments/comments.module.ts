import { Module } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { DynamoModule } from '../dynamo/dynamo.module';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [DynamoModule, TasksModule],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
