import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');

    if (!clientID || !clientSecret) {
      throw new Error(
        'Google OAuth credentials must be configured in .env file.',
      );
    }

    super({
      clientID,
      clientSecret,
      callbackURL: 'http://localhost:3000/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string | undefined,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const { id, name, emails } = profile;
    const user = {
      googleId: id,
      email: emails?.[0]?.value,
      name: `${name?.givenName} ${name?.familyName}`,
    };
    done(null, user);
  }
}
