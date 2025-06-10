import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { LoggerService } from '../common/logger/logger.service';
import { OAuthUserDetails } from './dto/oauth-user-details.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(AuthService.name);
  }

  async validateOAuthUser(details: OAuthUserDetails): Promise<User> {
    try {
      this.logger.log(`Validating user: ${details.email}`);
      let user = await this.usersService.findByGoogleId(details.googleId);
      if (user) return user;

      user = await this.usersService.findByEmail(details.email);
      if (user) return user;

      this.logger.log(
        `User not found with Google ID or email. Creating new user.`,
      );
      return await this.usersService.createWithGoogle(
        details.googleId,
        details.email,
        details.name,
      );
    } catch (error) {
      this.logger.error(
        'Error validating OAuth user',
        error instanceof Error ? error.stack : String(error),
      );
      throw new HttpException(
        'Authentication Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  generateJwt(user: User): string {
    const payload = { email: user.email, sub: user.id };
    this.logger.log(`Generating JWT for user: ${user.email}`);
    return this.jwtService.sign(payload);
  }
}
