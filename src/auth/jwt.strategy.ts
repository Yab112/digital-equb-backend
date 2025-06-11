import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { UsersService } from '../users/users.service';
import { Request } from 'express';

// This is the shape of the decoded JWT payload
interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly usersService: UsersService,
    configService: ConfigService,
  ) {
    // --- The Fix ---
    // 1. Get the secret from config
    const jwtSecret = configService.get<string>('JWT_SECRET');

    // 2. Throw an error on startup if it's missing
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in the .env file.');
    }

    super({
      // Extract JWT from the 'access_token' cookie
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request): string | null => {
          if (
            request &&
            request.cookies &&
            typeof (request.cookies as { [key: string]: any }).access_token ===
              'string'
          ) {
            return typeof (request.cookies as { [key: string]: any })
              .access_token === 'string'
              ? ((request.cookies as { [key: string]: any })
                  .access_token as string)
              : null;
          }
          return null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret, // 3. Pass the guaranteed string here
    });
  }

  // This method runs after the JWT is successfully validated
  async validate(payload: JwtPayload) {
    // The payload is already verified at this point, but we can fetch fresh user data
    const user = await this.usersService.findByEmail(payload.email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User is not active or not found.');
    }
    // The returned user object will be attached to the request (req.user)
    return user;
  }
}
