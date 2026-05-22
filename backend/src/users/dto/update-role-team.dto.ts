import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import type { UserRole } from '../../common/types';

export class UpdateRoleTeamDto {
  @IsIn(['Manager', 'Employee'])
  role!: UserRole;

  @IsString()
  @IsNotEmpty()
  teamId!: string;
}
