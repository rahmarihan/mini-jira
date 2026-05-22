import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { CognitoAuthGuard } from './cognito-auth.guard';
import { ConfirmRegistrationDto } from './dto/confirm-registration.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendConfirmationDto } from './dto/resend-confirmation.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('users')
  @UseGuards(CognitoAuthGuard)
  getAllUsers() {
    return this.authService.getAllUsers();
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('register/confirm')
  confirmRegistration(@Body() dto: ConfirmRegistrationDto) {
    return this.authService.confirmRegistration(dto);
  }

  @Post('register/resend-code')
  resendConfirmationCode(@Body() dto: ResendConfirmationDto) {
    return this.authService.resendConfirmationCode(dto.email);
  }

  @Get('me')
  @UseGuards(CognitoAuthGuard)
  me(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.getMe(user);
  }
}
