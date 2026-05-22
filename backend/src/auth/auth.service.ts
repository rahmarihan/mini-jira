import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  AdminGetUserCommand,
  ConfirmSignUpCommand,
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  ResendConfirmationCodeCommand,
  SignUpCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { DynamoService } from '../dynamo/dynamo.service';
import type { AuthUser, TeamId, UserRole } from '../common/types';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ConfirmRegistrationDto } from './dto/confirm-registration.dto';

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
  private readonly demoConfirmationInbox =
    process.env.COGNITO_DEMO_CONFIRMATION_EMAIL || '';

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

  async login(dto: LoginDto) {
    try {
      const result = await this.initiatePasswordAuth(dto.email, dto.password);

      const auth = result.AuthenticationResult;
      if (!auth?.IdToken) {
        throw new UnauthorizedException('Login did not return an ID token');
      }

      const payload = (await this.idVerifier.verify(
        auth.IdToken,
      )) as CognitoPayload;
      const user = await this.mergeStoredUser(this.buildUserFromPayload(payload));

      return {
        accessToken: auth.AccessToken,
        idToken: auth.IdToken,
        refreshToken: auth.RefreshToken,
        expiresIn: auth.ExpiresIn,
        tokenType: auth.TokenType,
        user,
      };
    } catch (error: unknown) {
      if (error instanceof UnauthorizedException) throw error;
      throw this.toCognitoException(error, 'login');
    }
  }

  async register(dto: RegisterDto) {
    try {
      const signUpResult = await this.signUp(dto);
      const userId =
        signUpResult.UserSub || (await this.findUserSub(dto.email));

      if (signUpResult.UserConfirmed) {
        await this.ensureUserItem({
          userId,
          sub: userId,
          email: dto.email,
          name: dto.name,
        });
      }

      return {
        message:
          'Account created. Please wait for a Manager to assign your role and team.',
        user: {
          userId,
          sub: userId,
          email: dto.email,
          name: dto.name,
        },
        userConfirmed: signUpResult.UserConfirmed,
      };
    } catch (error: unknown) {
      throw this.toCognitoException(error, 'register');
    }
  }

  async confirmRegistration(dto: ConfirmRegistrationDto) {
    try {
      await this.cognito.send(
        new ConfirmSignUpCommand({
          ClientId: this.clientId,
          Username: this.toCognitoUsername(dto.email),
          ConfirmationCode: dto.code,
        }),
      );
      const userId = await this.findUserSub(dto.email);
      const cognitoUser = await this.getCognitoUserAttributes(dto.email);

      await this.ensureUserItem({
        userId,
        sub: userId,
        email: dto.email,
        name: cognitoUser.name || dto.email,
      });

      return {
        message: 'Account confirmed. You can sign in now.',
      };
    } catch (error: unknown) {
      throw new BadRequestException(
        this.getErrorMessage(error, 'Could not confirm account'),
      );
    }
  }

  async resendConfirmationCode(email: string) {
    try {
      await this.cognito.send(
        new ResendConfirmationCodeCommand({
          ClientId: this.clientId,
          Username: this.toCognitoUsername(email),
        }),
      );

      return {
        message: 'Confirmation code sent. Check your email.',
      };
    } catch (error: unknown) {
      throw new BadRequestException(
        this.getErrorMessage(error, 'Could not resend confirmation code'),
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

    if (!storedUser) {
      await this.ensureUserItem(user);
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

  private signUp(dto: RegisterDto) {
    const deliveryEmail = this.getCognitoDeliveryEmail(dto.email);

    return this.cognito.send(
      new SignUpCommand({
        ClientId: this.clientId,
        Username: this.toCognitoUsername(dto.email),
        Password: dto.password,
        UserAttributes: [
          { Name: 'email', Value: deliveryEmail },
          { Name: 'name', Value: dto.name },
        ],
      }),
    );
  }

  private async initiatePasswordAuth(email: string, password: string) {
    try {
      return await this.cognito.send(
        new InitiateAuthCommand({
          AuthFlow: 'USER_PASSWORD_AUTH',
          ClientId: this.clientId,
          AuthParameters: {
            USERNAME: email,
            PASSWORD: password,
          },
        }),
      );
    } catch (error: unknown) {
      if (!this.demoConfirmationInbox) throw error;
      return this.cognito.send(
        new InitiateAuthCommand({
          AuthFlow: 'USER_PASSWORD_AUTH',
          ClientId: this.clientId,
          AuthParameters: {
            USERNAME: this.toCognitoUsername(email),
            PASSWORD: password,
          },
        }),
      );
    }
  }

  private async findUserSub(email: string) {
    const result = await this.cognito.send(
      new AdminGetUserCommand({
        UserPoolId: this.userPoolId,
        Username: this.toCognitoUsername(email),
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

  private async getCognitoUserAttributes(email: string) {
    const result = await this.cognito.send(
      new AdminGetUserCommand({
        UserPoolId: this.userPoolId,
        Username: this.toCognitoUsername(email),
      }),
    );

    return (result.UserAttributes || []).reduce<Record<string, string>>(
      (attributes, attribute) => {
        if (attribute.Name && attribute.Value) {
          attributes[attribute.Name] = attribute.Value;
        }
        return attributes;
      },
      {},
    );
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

  private toRole(value?: string): UserRole | undefined {
    if (!value) return undefined;
    if (value === 'Manager' || value === 'Employee') return value;
    if (value.toLowerCase() === 'manager') return 'Manager';
    if (value.toLowerCase() === 'employee') return 'Employee';
    throw new UnauthorizedException('Token has an invalid role');
  }

  private toTeamId(value?: string): TeamId | undefined {
    return value || undefined;
  }

  private async mergeStoredUser(user: AuthUser): Promise<AuthUser> {
    try {
      const storedUser = await this.dynamo.getItem(this.usersTable, {
        userId: user.userId,
      });
      if (!storedUser) return user;
      return {
        ...user,
        email: storedUser.email ? String(storedUser.email) : user.email,
        name: storedUser.name ? String(storedUser.name) : user.name,
        role: this.toRole(String(storedUser.role || user.role || '')),
        teamId: storedUser.teamId ? String(storedUser.teamId) : user.teamId,
      };
    } catch {
      return user;
    }
  }

  private getErrorMessage(error: unknown, fallback: string) {
    if (error instanceof Error) return error.message;
    return fallback;
  }

  private toCognitoUsername(email: string) {
    return `email_${email.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_')}`;
  }

  private getCognitoDeliveryEmail(requestedEmail: string) {
    if (!this.demoConfirmationInbox) return requestedEmail;

    const [localPart, domain] = this.demoConfirmationInbox
      .trim()
      .toLowerCase()
      .split('@');
    if (!localPart || !domain) return requestedEmail;

    const alias = requestedEmail
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/^_+|_+$/g, '');

    return `${localPart}+${alias || 'demo'}@${domain}`;
  }

  private toCognitoException(error: unknown, context: 'login' | 'register') {
    const name = error instanceof Error ? error.name : '';
    const message = this.getErrorMessage(error, 'Cognito request failed');
    console.error(`Cognito ${context} failed:`, name || message);

    if (name === 'UsernameExistsException') {
      return new ConflictException('Email already exists');
    }
    if (name === 'UserNotFoundException') {
      return new UnauthorizedException('Wrong email or password');
    }
    if (name === 'NotAuthorizedException') {
      return new UnauthorizedException('Wrong email or password');
    }
    if (name === 'UserNotConfirmedException') {
      return new UnauthorizedException('User is not confirmed');
    }
    if (
      name === 'InvalidParameterException' ||
      name === 'InvalidPasswordException'
    ) {
      return new BadRequestException(message);
    }
    if (context === 'login') {
      return new UnauthorizedException('Login failed');
    }
    return new InternalServerErrorException('Registration failed');
  }
}
