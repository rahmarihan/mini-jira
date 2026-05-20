import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CognitoAuthGuard } from './cognito-auth.guard';

@Module({
  controllers: [AuthController],
  providers: [AuthService, CognitoAuthGuard],
  exports: [AuthService, CognitoAuthGuard],
})
export class AuthModule {}
