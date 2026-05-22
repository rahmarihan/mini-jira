import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  AdminGetUserCommand,
  AdminUpdateUserAttributesCommand,
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { DynamoService } from '../dynamo/dynamo.service';
import type { AuthUser, TeamId, UserRole } from '../common/types';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

type CognitoPayload = {
  sub: string;
  email?: string;
  name?: string;
  'custom:role'?: string;
  'custom:teamId'?: string;
};

@Injectable()
export class AuthService {
  private readonly cognito: CognitoIdentityProviderClient;
  private readonly idVerifier: ReturnType<typeof CognitoJwtVerifier.create>;
  private readonly region = process.env.AWS_REGION || 'eu-north-1';
  private readonly userPoolId =
    process.env.COGNITO_USER_POOL_ID || 'eu-north-1_7kSYxgEr6';
  private readonly clientId =
    process.env.COGNITO_CLIENT_ID || 'mu4hog4jim74lhah2s4svbv41';
  private readonly usersTable =
    process.env.DYNAMODB_USERS_TABLE || 'Mini-jira-Users';

  constructor(private readonly dynamo: DynamoService) {
    this.cognito = new CognitoIdentityProviderClient({
      region: this.region,
    });
    this.idVerifier = CognitoJwtVerifier.create({
      userPoolId: this.userPoolId,
      tokenUse: 'id',
      clientId: this.clientId,
    });
  }

  // add this method inside AuthService class
  async getAllUsers() {
    return this.dynamo.scan(this.usersTable);
  }

  async login(dto: LoginDto) {
    try {
      const result = await this.cognito.send(
        new InitiateAuthCommand({
          AuthFlow: 'USER_PASSWORD_AUTH',
          ClientId: this.clientId,
          AuthParameters: {
            USERNAME: dto.email,
            PASSWORD: dto.password,
          },
        }),
      );

      const auth = result.AuthenticationResult;
      if (!auth?.IdToken) {
        throw new UnauthorizedException('Login did not return an ID token');
      }

      const payload = (await this.idVerifier.verify(
        auth.IdToken,
      )) as CognitoPayload;
      const user = this.buildUserFromPayload(payload);

      return {
        accessToken: auth.AccessToken,
        idToken: auth.IdToken,
        refreshToken: auth.RefreshToken,
        expiresIn: auth.ExpiresIn,
        tokenType: auth.TokenType,
        user,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid email or password');
    }
  }

  async register(dto: RegisterDto) {
    const teamId = dto.teamId;

    try {
      const signUpResult = await this.signUp(dto, true);
      const userId =
        signUpResult.UserSub || (await this.findUserSub(dto.email));

      await this.ensureUserItem({
        userId,
        sub: userId,
        email: dto.email,
        name: dto.name,
        role: 'Employee',
        teamId,
      });

      return {
        message:
          'Registration succeeded. Please confirm the account if Cognito requires confirmation before login.',
        user: {
          userId,
          email: dto.email,
          name: dto.name,
          role: 'Employee' as UserRole,
          teamId,
        },
        userConfirmed: signUpResult.UserConfirmed,
      };
    } catch (error: unknown) {
      if (this.isAttributePermissionError(error)) {
        return this.registerWithAdminAttributeFallback(dto);
      }
      throw new BadRequestException(
        this.getErrorMessage(error, 'Registration failed'),
      );
    }
  }

  async getMe(user: AuthUser) {
    let storedUser: Record<string, any> | null = null;

    try {
      storedUser = await this.dynamo.getItem(this.usersTable, {
        userId: user.userId,
      });
    } catch {
      // DynamoDB is only an enrichment source for /auth/me. A valid Cognito
      // token should still return the authenticated user claims.
      storedUser = null;
    }

    return {
      ...user,
      ...(storedUser || {}),
      userId: user.userId,
      sub: user.sub,
      role: user.role,
      teamId: user.teamId,
    };
  }

  private async registerWithAdminAttributeFallback(dto: RegisterDto) {
    const signUpResult = await this.signUp(dto, false);
    const userId = signUpResult.UserSub || (await this.findUserSub(dto.email));

    await this.cognito.send(
      new AdminUpdateUserAttributesCommand({
        UserPoolId: this.userPoolId,
        Username: dto.email,
        UserAttributes: [
          { Name: 'custom:role', Value: 'Employee' },
          { Name: 'custom:teamId', Value: dto.teamId },
          { Name: 'name', Value: dto.name },
          { Name: 'email', Value: dto.email },
        ],
      }),
    );

    await this.ensureUserItem({
      userId,
      sub: userId,
      email: dto.email,
      name: dto.name,
      role: 'Employee',
      teamId: dto.teamId,
    });

    return {
      message:
        'Registration succeeded. Please confirm the account if Cognito requires confirmation before login.',
      user: {
        userId,
        email: dto.email,
        name: dto.name,
        role: 'Employee' as UserRole,
        teamId: dto.teamId,
      },
      userConfirmed: signUpResult.UserConfirmed,
    };
  }

  private signUp(dto: RegisterDto, includeCustomAttributes: boolean) {
    return this.cognito.send(
      new SignUpCommand({
        ClientId: this.clientId,
        Username: dto.email,
        Password: dto.password,
        UserAttributes: [
          { Name: 'email', Value: dto.email },
          { Name: 'name', Value: dto.name },
          ...(includeCustomAttributes
            ? [
                { Name: 'custom:role', Value: 'Employee' },
                { Name: 'custom:teamId', Value: dto.teamId },
              ]
            : []),
        ],
      }),
    );
  }

  private async findUserSub(email: string) {
    const result = await this.cognito.send(
      new AdminGetUserCommand({
        UserPoolId: this.userPoolId,
        Username: email,
      }),
    );
    const sub = result.UserAttributes?.find(
      (attr) => attr.Name === 'sub',
    )?.Value;
    if (!sub) {
      throw new BadRequestException('Could not resolve Cognito user id');
    }
    return sub;
  }

  private buildUserFromPayload(payload: CognitoPayload): AuthUser {
    const role = this.toRole(payload['custom:role']);
    const teamId = this.toTeamId(payload['custom:teamId']);
    if (!payload.email) {
      throw new UnauthorizedException('Token is missing email');
    }

    return {
      userId: payload.sub,
      sub: payload.sub,
      email: payload.email,
      name: payload.name || payload.email,
      role,
      teamId,
    };
  }

  private async ensureUserItem(user: AuthUser) {
    await this.dynamo.putItem(this.usersTable, {
      userId: user.userId,
      email: user.email,
      name: user.name,
      role: user.role,
      teamId: user.teamId,
    });
  }

  private toRole(value?: string): UserRole {
    if (!value) return 'Employee';
    if (value === 'Manager' || value === 'Employee') return value;
    if (value.toLowerCase() === 'manager') return 'Manager';
    if (value.toLowerCase() === 'employee') return 'Employee';
    throw new UnauthorizedException('Token has an invalid role');
  }

  private toTeamId(value?: string): TeamId {
    if (value === 'ALL' || value === 'Frontend' || value === 'Backend') {
      return value;
    }
    throw new UnauthorizedException('Token has an invalid teamId');
  }

  private isAttributePermissionError(error: unknown) {
    const message = this.getErrorMessage(error, '').toLowerCase();
    return (
      message.includes('attribute') &&
      (message.includes('writ') ||
        message.includes('custom:role') ||
        message.includes('custom:teamid'))
    );
  }

  private getErrorMessage(error: unknown, fallback: string) {
    if (error instanceof Error) return error.message;
    return fallback;
  }
}
