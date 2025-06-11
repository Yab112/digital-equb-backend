import { JwtService } from '@nestjs/jwt';
import { User } from '../users/user.entity';

export class JwtHelper {
  static generateJwt(user: User, jwtService: JwtService): string {
    const payload = {
      sub: user.id,
      email: user.email,
      phone: user.phoneNumber,
    };
    return jwtService.sign(payload);
  }
}
