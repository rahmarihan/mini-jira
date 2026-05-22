import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  AdminGetUserCommand,
  AdminUpdateUserAttributesCommand,
  CognitoIdentityProviderClient,
  ListUsersCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { DynamoService } from '../dynamo/dynamo.service';
import type { UserRole } from '../common/types';

type UserRecord = {
  userId: string;
  sub?: string;
  email?: string;
  name?: string;
  role?: UserRole;
  teamId?: string;
};

@Injectable()
export class UsersService {
  private readonly region = process.env.AWS_REGION || 'eu-north-1';
  private readonly userPoolId =
    process.env.COGNITO_USER_POOL_ID || 'eu-north-1_7kSYxgEr6';
  private readonly usersTable =
    process.env.DYNAMODB_USERS_TABLE || 'Mini-jira-Users';
  private readonly teamsTable =
    process.env.DYNAMODB_TEAMS_TABLE || 'Mini-jira-Teams';
  private readonly cognito = new CognitoIdentityProviderClient({
    region: this.region,
  });

  constructor(private readonly dynamo: DynamoService) {}

  async findAll() {
    const [dynamoUsers, cognitoUsers] = await Promise.all([
      this.scanUsersSafely(),
      this.listCognitoUsersSafely(),
    ]);

    const byId = new Map<string, UserRecord>();
    for (const user of cognitoUsers) {
      byId.set(user.userId, user);
    }
    for (const user of dynamoUsers) {
      const cognitoUser = byId.get(user.userId);
      if (!cognitoUser) continue;
      byId.set(user.userId, { ...cognitoUser, ...user });
    }

    return [...byId.values()].map((user) => ({
      userId: user.userId,
      sub: user.sub || user.userId,
      email: user.email || '',
      name: user.name || user.email || '',
      role: user.role,
      teamId: user.teamId,
    }));
  }

  async findTeams() {
    try {
      return await this.dynamo.scan(this.teamsTable);
    } catch (error: unknown) {
      console.error('DynamoDB teams scan failed:', this.errorName(error));
      throw new InternalServerErrorException('Could not load teams');
    }
  }

  async updateRoleTeam(userId: string, role: UserRole, teamId: string) {
    if (role !== 'Manager' && role !== 'Employee') {
      throw new BadRequestException('role must be Manager or Employee');
    }

    await this.validateTeamIfAvailable(teamId);
    const existing = await this.getExistingUser(userId);

    try {
      await this.cognito.send(
        new AdminUpdateUserAttributesCommand({
          UserPoolId: this.userPoolId,
          Username: existing.email
            ? this.toCognitoUsername(existing.email)
            : userId,
          UserAttributes: [
            { Name: 'custom:role', Value: role },
            { Name: 'custom:teamId', Value: teamId },
          ],
        }),
      );
    } catch (error: unknown) {
      throw this.toCognitoException(error);
    }

    try {
      const updates = { role, teamId };
      const current = await this.dynamo.getItem(this.usersTable, { userId });
      if (!current) {
        await this.dynamo.putItem(this.usersTable, {
          userId,
          email: existing.email,
          name: existing.name,
          ...updates,
        });
        return { userId, email: existing.email, name: existing.name, ...updates };
      }
      return await this.dynamo.updateItem(this.usersTable, { userId }, updates);
    } catch (error: unknown) {
      console.error('DynamoDB user role/team update failed:', {
        userId,
        error: this.errorName(error),
      });
      throw new InternalServerErrorException(
        'Cognito was updated, but saving the user record failed',
      );
    }
  }

  private async scanUsersSafely(): Promise<UserRecord[]> {
    try {
      const users = await this.dynamo.scan(this.usersTable);
      return users.map((user) => ({
        userId: String(user.userId || user.sub || ''),
        sub: String(user.sub || user.userId || ''),
        email: user.email ? String(user.email) : undefined,
        name: user.name ? String(user.name) : undefined,
        role: this.normalizeRole(user.role),
        teamId: user.teamId ? String(user.teamId) : undefined,
      })).filter((user) => user.userId);
    } catch (error: unknown) {
      console.error('DynamoDB users scan failed:', this.errorName(error));
      return [];
    }
  }

  private async listCognitoUsersSafely(): Promise<UserRecord[]> {
    try {
      const result = await this.cognito.send(
        new ListUsersCommand({ UserPoolId: this.userPoolId }),
      );
      return (result.Users || [])
        .filter((user) => user.UserStatus === 'CONFIRMED')
        .map((user) => {
          const attrs = Object.fromEntries(
            (user.Attributes || []).map((attr) => [attr.Name, attr.Value]),
          );
          return {
            userId: String(attrs.sub || user.Username || ''),
            sub: String(attrs.sub || user.Username || ''),
            email: attrs.email,
            name: attrs.name,
            role: this.normalizeRole(attrs['custom:role']),
            teamId: attrs['custom:teamId'],
          };
        })
        .filter((user) => user.userId);
    } catch (error: unknown) {
      console.error('Cognito list users failed:', this.errorName(error));
      return [];
    }
  }

  private async getExistingUser(userId: string): Promise<UserRecord> {
    const dynamoUser = await this.dynamo.getItem(this.usersTable, { userId });
    if (dynamoUser) {
      return {
        userId,
        email: dynamoUser.email ? String(dynamoUser.email) : undefined,
        name: dynamoUser.name ? String(dynamoUser.name) : undefined,
      };
    }

    try {
      const result = await this.cognito.send(
        new AdminGetUserCommand({
          UserPoolId: this.userPoolId,
          Username: userId,
        }),
      );
      const attrs = Object.fromEntries(
        (result.UserAttributes || []).map((attr) => [attr.Name, attr.Value]),
      );
      return {
        userId: String(attrs.sub || userId),
        email: attrs.email,
        name: attrs.name,
      };
    } catch (error: unknown) {
      if (this.errorName(error) === 'UserNotFoundException') {
        throw new NotFoundException('User not found');
      }
      throw this.toCognitoException(error);
    }
  }

  private async validateTeamIfAvailable(teamId: string) {
    const teams = await this.findTeams();
    if (teams.length === 0) return;
    const exists = teams.some((team) => String(team.teamId || team.id) === teamId);
    if (!exists) throw new NotFoundException('Team not found');
  }

  private normalizeRole(value: unknown): UserRole | undefined {
    if (value === 'Manager' || value === 'Employee') return value;
    return undefined;
  }

  private toCognitoException(error: unknown) {
    const name = this.errorName(error);
    console.error('Cognito user management failed:', name);
    if (name === 'UserNotFoundException') return new NotFoundException('User not found');
    if (name === 'InvalidParameterException') {
      return new BadRequestException('Invalid user attribute update');
    }
    if (name === 'NotAuthorizedException') {
      return new InternalServerErrorException('Backend is not authorized to update Cognito users');
    }
    return new InternalServerErrorException('Could not update Cognito user');
  }

  private errorName(error: unknown) {
    return error instanceof Error ? error.name || error.message : String(error);
  }

  private toCognitoUsername(email: string) {
    return `email_${email.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_')}`;
  }
}
