import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  AdminGetUserCommand,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import type { Request } from 'express';
import type { AuthUser, TeamId, UserRole } from '../common/types';

type CognitoPayload = {
  sub: string;
  email?: string;
  name?: string;
  'custom:role'?: string;
  'custom:teamId'?: string;
  'cognito:username'?: string;
  username?: string;
};

@Injectable()
export class CognitoAuthGuard implements CanActivate {
  private readonly region = process.env.AWS_REGION || 'eu-north-1';
  private readonly userPoolId =
    process.env.COGNITO_USER_POOL_ID || 'eu-north-1_7kSYxgEr6';
  private readonly clientId =
    process.env.COGNITO_CLIENT_ID || 'mu4hog4jim74lhah2s4svbv41';
  private readonly cognito = new CognitoIdentityProviderClient({
    region: this.region,
  });

  private readonly idVerifier = CognitoJwtVerifier.create({
    userPoolId: this.userPoolId,
    tokenUse: 'id',
    clientId: this.clientId,
  });

  private readonly accessVerifier = CognitoJwtVerifier.create({
    userPoolId: this.userPoolId,
    tokenUse: 'access',
    clientId: this.clientId,
  });

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthUser }>();
    const token = this.extractBearerToken(request.headers.authorization);

    try {
      // The frontend intentionally sends the Cognito ID token because it carries
      // email, name, custom:role, and custom:teamId for this MVP.
      const payload = await this.verifyIdTokenFirst(token);
      request.user = await this.toAuthUser(payload);
      return true;
    } catch (error: unknown) {
      throw this.toUnauthorizedException(error);
    }
  }

  private extractBearerToken(header?: string) {
    if (!header) {
      throw new UnauthorizedException('Missing Authorization header');
    }
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Expected Bearer token');
    }
    return token;
  }

  private async verifyIdTokenFirst(token: string): Promise<CognitoPayload> {
    try {
      return await this.idVerifier.verify(token);
    } catch {
      return await this.accessVerifier.verify(token);
    }
  }

  private async toAuthUser(payload: CognitoPayload): Promise<AuthUser> {
    const enrichedPayload = await this.enrichMissingClaims(payload);

    if (!enrichedPayload.sub || !enrichedPayload.email) {
      throw new UnauthorizedException('Token is missing required user claims');
    }

    const role = this.toRole(enrichedPayload['custom:role']);
    const teamId = this.toTeamId(enrichedPayload['custom:teamId']);

    return {
      userId: enrichedPayload.sub,
      sub: enrichedPayload.sub,
      email: enrichedPayload.email,
      name: enrichedPayload.name || enrichedPayload.email,
      role,
      teamId,
    };
  }

  private async enrichMissingClaims(
    payload: CognitoPayload,
  ): Promise<CognitoPayload> {
    if (payload.email && payload['custom:teamId']) return payload;

    const username =
      payload['cognito:username'] || payload.username || payload.sub;
    const result = await this.cognito.send(
      new AdminGetUserCommand({
        UserPoolId: this.userPoolId,
        Username: username,
      }),
    );

    const attributes = (result.UserAttributes || []).reduce<
      Record<string, string | undefined>
    >((acc, attribute) => {
      if (attribute.Name) acc[attribute.Name] = attribute.Value;
      return acc;
    }, {});

    return {
      ...payload,
      sub: payload.sub || String(attributes.sub || ''),
      email: payload.email || String(attributes.email || ''),
      name: payload.name || String(attributes.name || ''),
      'custom:role':
        payload['custom:role'] || String(attributes['custom:role'] || ''),
      'custom:teamId':
        payload['custom:teamId'] || String(attributes['custom:teamId'] || ''),
    };
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

  private toUnauthorizedException(error: unknown) {
    if (error instanceof UnauthorizedException) return error;
    const name = error instanceof Error ? error.name : '';
    const message = error instanceof Error ? error.message : String(error);

    if (name.toLowerCase().includes('expired') || message.includes('expired')) {
      return new UnauthorizedException('Token has expired');
    }
    if (message.toLowerCase().includes('issuer')) {
      return new UnauthorizedException('Token is from the wrong user pool');
    }
    if (
      message.toLowerCase().includes('client') ||
      message.toLowerCase().includes('audience')
    ) {
      return new UnauthorizedException('Token is from the wrong app client');
    }
    return new UnauthorizedException('Invalid token signature or claims');
  }
}
