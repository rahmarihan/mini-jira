import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { CognitoAuthGuard } from '../auth/cognito-auth.guard';
import { Roles, RolesGuard } from '../common/guards/roles.guard';
import { UpdateRoleTeamDto } from './dto/update-role-team.dto';
import { UsersService } from './users.service';

@Controller()
@UseGuards(CognitoAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('users')
  @Roles('Manager')
  findAllUsers() {
    return this.usersService.findAll();
  }

  @Get('teams')
  findTeams() {
    return this.usersService.findTeams();
  }

  @Patch('users/:userId/role-team')
  @Roles('Manager')
  updateRoleTeam(
    @Param('userId') userId: string,
    @Body() dto: UpdateRoleTeamDto,
  ) {
    return this.usersService.updateRoleTeam(userId, dto.role, dto.teamId);
  }
}
