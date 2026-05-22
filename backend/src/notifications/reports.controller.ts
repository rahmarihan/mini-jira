import { Controller, Get } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('notifications/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('team-summary')
  async getTeamSummary() {
    return this.reportsService.getTeamSummary();
  }
}