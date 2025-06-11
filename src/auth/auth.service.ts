import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { JwtService } from '@nestjs/jwt';
import { Cache } from 'cache-manager';
import { randomInt } from 'crypto';
import { isEmail, isPhoneNumber } from 'class-validator';
import { v4 as uuidv4 } from 'uuid';

import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { LoggerService } from '../common/logger/logger.service';
import { TwilioService } from '../common/twilio.service';
import { EmailService } from '../common/email.service';
import { EncryptionHelper } from './encryption.helper';
import { JwtHelper } from './jwt.helper';

type OAuthUserDetails = { googleId: string; email: string; name: string };

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly logger: LoggerService,
    private readonly twilioService: TwilioService,
    private readonly emailService: EmailService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    this.logger.setContext(AuthService.name);
  }

  async validateOAuthUser(details: OAuthUserDetails): Promise<User> {
    try {
      const user = await this.usersService.findByGoogleId(details.googleId);
      if (user) return user;

      const existingUserByEmail = await this.usersService.findByEmail(
        details.email,
      );
      if (existingUserByEmail) {
        return this.usersService.update(existingUserByEmail.id, {
          googleId: details.googleId,
        });
      }

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

  async loginWithPassword(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.isActive || !user.isEmailVerified || !user.password) {
      throw new HttpException(
        'Invalid credentials or account not active.',
        HttpStatus.UNAUTHORIZED,
      );
    }
    const isMatch = await EncryptionHelper.comparePassword(
      password,
      user.password,
    );
    if (!isMatch) {
      throw new HttpException('Invalid credentials.', HttpStatus.UNAUTHORIZED);
    }
    return user;
  }

  async startRegistration(
    email: string,
    phoneNumber: string,
    password: string,
  ): Promise<User> {
    const existingUser =
      (await this.usersService.findByEmail(email)) ||
      (await this.usersService.findByPhoneNumber(phoneNumber));
    if (existingUser?.isActive) {
      throw new HttpException(
        'An active user with this email or phone number already exists.',
        HttpStatus.CONFLICT,
      );
    }
    const hashedPassword = await EncryptionHelper.hashPassword(password);
    const user =
      existingUser ||
      (await this.usersService.create({
        email,
        phoneNumber,
        password: hashedPassword,
      }));
    const otp = this._generateOtp();
    await this.cacheManager.set(`otp:phone-verify:${user.id}`, otp, 300);
    await this.twilioService.sendSms(
      phoneNumber,
      `Your Digital Equb verification code is: ${otp}`,
    );
    return user;
  }

  async verifyPhoneNumber(phoneNumber: string, otp: string): Promise<void> {
    const user = await this.usersService.findByPhoneNumber(phoneNumber);
    if (!user) throw new HttpException('User not found.', HttpStatus.NOT_FOUND);

    const storedOtp = await this.cacheManager.get<string>(
      `otp:phone-verify:${user.id}`,
    );
    if (storedOtp !== otp)
      throw new HttpException(
        'Invalid or expired OTP.',
        HttpStatus.BAD_REQUEST,
      );

    await this.usersService.update(user.id, { isPhoneNumberVerified: true });
    await this.cacheManager.del(`otp:phone-verify:${user.id}`);

    const emailToken = uuidv4();
    await this.cacheManager.set(
      `email-verify-token:${emailToken}`,
      user.id,
      3600,
    );

    if (!user.email)
      throw new HttpException(
        'User has no email to verify.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    await this.emailService.sendVerificationEmail(user.email, emailToken);
  }

  async verifyEmailAndActivate(token: string): Promise<User> {
    const userId = await this.cacheManager.get<string>(
      `email-verify-token:${token}`,
    );
    if (!userId)
      throw new HttpException(
        'Invalid or expired verification link.',
        HttpStatus.BAD_REQUEST,
      );

    const user = await this.usersService.update(userId, {
      isEmailVerified: true,
      isActive: true,
    });
    await this.cacheManager.del(`email-verify-token:${token}`);
    return user;
  }

  async requestLoginOtp(identifier: string): Promise<void> {
    const user = await this._findUserByIdentifier(identifier);
    if (!user || !user.isActive)
      throw new HttpException('No active account found.', HttpStatus.NOT_FOUND);

    const otp = this._generateOtp();
    await this.cacheManager.set(`otp:login:${identifier}`, otp, 300);

    if (isEmail(identifier)) {
      if (!user.email)
        throw new HttpException(
          'User has no registered email.',
          HttpStatus.BAD_REQUEST,
        );
      await this.emailService.sendLoginOtp(user.email, otp);
    } else {
      if (!user.phoneNumber)
        throw new HttpException(
          'User has no registered phone number.',
          HttpStatus.BAD_REQUEST,
        );
      await this.twilioService.sendSms(
        user.phoneNumber,
        `Your Digital Equb login code is: ${otp}`,
      );
    }
  }

  async verifyLoginOtp(identifier: string, otp: string): Promise<User> {
    const storedOtp = await this.cacheManager.get<string>(
      `otp:login:${identifier}`,
    );
    if (storedOtp !== otp)
      throw new HttpException(
        'Invalid or expired OTP.',
        HttpStatus.BAD_REQUEST,
      );

    const user = await this._findUserByIdentifier(identifier);
    if (!user) throw new HttpException('User not found.', HttpStatus.NOT_FOUND);

    await this.cacheManager.del(`otp:login:${identifier}`);
    return user;
  }

  generateJwt(user: User): string {
    return JwtHelper.generateJwt(user, this.jwtService);
  }

  private _generateOtp(): string {
    return randomInt(100000, 999999).toString();
  }

  private async _findUserByIdentifier(
    identifier: string,
  ): Promise<User | null> {
    if (isEmail(identifier)) return this.usersService.findByEmail(identifier);
    if (isPhoneNumber(identifier, 'ET'))
      return this.usersService.findByPhoneNumber(identifier);
    return null;
  }
}
