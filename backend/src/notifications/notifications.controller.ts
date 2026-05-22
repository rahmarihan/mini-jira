import { Controller, Get } from '@nestjs/common';

@Controller('notifications')
export class NotificationsController {
  @Get('health')
  healthCheck() {
    return {
      message: 'Notifications module is working',
    };
  }
}
