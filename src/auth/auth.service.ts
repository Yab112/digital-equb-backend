import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
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
import { PendingRegistration } from './dto/pending-registration.type';
import { UpstashService } from '../common/upstash.service';
import { SetCommandOptions } from '@upstash/redis';

type OAuthUserDetails = { googleId: string; email: string; name: string };

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly logger: LoggerService,
    private readonly twilioService: TwilioService,
    private readonly emailService: EmailService,
    private readonly upstashService: UpstashService,
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
    name: string,
  ): Promise<void> {
    const registrationKey = `registration:${email}`;
    const phoneKey = `registration-phone:${phoneNumber}`;

    // DEBUG: Log Upstash connection and set/get result
    try {
      const ping = await this.upstashService.redis.ping?.();
      this.logger.log(`[Upstash] Redis ping: ${ping}`);
    } catch (e) {
      this.logger.error(`[Upstash] Redis ping failed: ${e}`);
    }

    const existing =
      await this.upstashService.redis.get<string>(registrationKey);
    this.logger.log(`[Upstash] GET ${registrationKey}: ${existing}`);

    if (existing) {
      throw new HttpException(
        'Registration already started for this email.',
        HttpStatus.CONFLICT,
      );
    }

    const otp = this._generateOtp();
    const hashedPassword = await EncryptionHelper.hashPassword(password);
    const registrationData: PendingRegistration = {
      email,
      phoneNumber,
      password: hashedPassword,
      name,
      phoneVerified: false,
      emailVerified: false,
    };

    const expiryOptions: SetCommandOptions = { ex: 3600 };
    await this.upstashService.redis.set(
      registrationKey,
      JSON.stringify(registrationData),
      expiryOptions,
    );
    this.logger.log(`[Upstash] SET ${registrationKey}`);

    await this.upstashService.redis.set(
      phoneKey,
      registrationKey,
      expiryOptions,
    );

    await this.upstashService.redis.set(
      `otp:phone-verify:${phoneNumber}`,
      otp,
      { ex: 300 },
    );

    await this.twilioService.sendSms(
      phoneNumber,
      `Your Digital Equb verification code is: ${otp}`,
    );
  }

  async resendPhoneVerificationOtp(phoneNumber: string): Promise<void> {
    const phoneKey = `registration-phone:${phoneNumber}`;
    const registrationKey =
      await this.upstashService.redis.get<string>(phoneKey);

    if (!registrationKey) {
      throw new HttpException(
        'No pending registration found for this phone number.',
        HttpStatus.NOT_FOUND,
      );
    }

    const otp = this._generateOtp();
    await this.upstashService.redis.set(
      `otp:phone-verify:${phoneNumber}`,
      otp,
      { ex: 300 }, // 5-minute expiry
    );

    await this.twilioService.sendSms(
      phoneNumber,
      `Your new Digital Equb verification code is: ${otp}`,
    );
  }

  async verifyPhoneNumber(phoneNumber: string, otp: string): Promise<void> {
    const phoneKey = `registration-phone:${phoneNumber}`;
    const otpKey = `otp:phone-verify:${phoneNumber}`;

    // 1. Get registration key by phone
    const registrationKey =
      await this.upstashService.redis.get<string>(phoneKey);
    if (!registrationKey) {
      throw new HttpException('Registration not found.', HttpStatus.NOT_FOUND);
    }

    // 2. Load registration data
    const registrationDataRaw =
      await this.upstashService.redis.get<string>(registrationKey);
    if (!registrationDataRaw) {
      throw new HttpException(
        'Registration data missing.',
        HttpStatus.NOT_FOUND,
      );
    }

    let registrationData: PendingRegistration;
    try {
      registrationData = JSON.parse(registrationDataRaw) as PendingRegistration;
    } catch (e) {
      throw new HttpException(
        'Corrupted registration data.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // 3. Compare OTP
    const storedOtp = await this.upstashService.redis.get<string>(otpKey);
    this.logger.log(`[DEBUG] OTP raw value from Redis: ${storedOtp} (type: ${typeof storedOtp})`);
    if (typeof storedOtp === 'object' || storedOtp === null) {
      this.logger.error(`[CRITICAL] OTP value is not a string! Value: ${JSON.stringify(storedOtp)}`);
      throw new HttpException(
        'OTP value in Redis is not a string. Please clear your Redis keys for this phone and try again.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    if (!storedOtp || storedOtp !== otp) {
      throw new HttpException(
        'Invalid or expired OTP.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 4. Mark phone as verified
    registrationData.phoneVerified = true;

    // 5. Save back updated registration
    const expiryOptions: SetCommandOptions = { ex: 3600 };
    await this.upstashService.redis.set(
      registrationKey,
      JSON.stringify(registrationData),
      expiryOptions,
    );

    // 6. Clean up OTP
    await this.upstashService.redis.del(otpKey);

    // 7. Generate and send email verification token
    const emailToken = uuidv4(); // Make sure uuidv4() is imported
    await this.upstashService.redis.set(
      `email-verify-token:${emailToken}`,
      registrationKey,
      expiryOptions,
    );

    await this.emailService.sendVerificationEmail(
      registrationData.email,
      emailToken,
    );
  }

  async verifyEmailAndActivate(token: string): Promise<User> {
    const emailTokenKey = `email-verify-token:${token}`;

    // 1. Get registration key from token
    const registrationKey =
      await this.upstashService.redis.get<string>(emailTokenKey);
    if (!registrationKey) {
      throw new HttpException(
        'Invalid or expired verification link.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 2. Get registration data
    const registrationDataRaw =
      await this.upstashService.redis.get<string>(registrationKey);
    if (!registrationDataRaw) {
      throw new HttpException('Registration not found.', HttpStatus.NOT_FOUND);
    }

    let registrationData: PendingRegistration;
    try {
      registrationData = JSON.parse(registrationDataRaw) as PendingRegistration;
    } catch (e) {
      this.logger.error(`Failed to parse registration data: ${e}`);
      throw new HttpException(
        'Corrupted registration data.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // 3. Mark email as verified
    registrationData.emailVerified = true;

    // 4. Save updated registration
    const expiryOptions: SetCommandOptions = { ex: 3600 };
    await this.upstashService.redis.set(
      registrationKey,
      JSON.stringify(registrationData),
      expiryOptions,
    );

    // 5. If both verifications are complete, activate user
    if (registrationData.phoneVerified && registrationData.emailVerified) {
      const user = await this.usersService.create({
        email: registrationData.email,
        phoneNumber: registrationData.phoneNumber,
        password: registrationData.password, // Already hashed
        name: registrationData.name,
        googleId: null,
        isActive: true,
        isEmailVerified: true,
        isPhoneNumberVerified: true,
      });

      // 6. Clean up Redis keys
      await this.upstashService.redis.del(registrationKey);
      await this.upstashService.redis.del(
        `registration-phone:${registrationData.phoneNumber}`,
      );
      await this.upstashService.redis.del(emailTokenKey);

      return user;
    }

    // 7. If phone not verified yet
    throw new HttpException(
      'Phone or email not verified yet.',
      HttpStatus.BAD_REQUEST,
    );
  }

  async requestLoginOtp(identifier: string): Promise<void> {
    const user = await this._findUserByIdentifier(identifier);
    if (!user || !user.isActive)
      throw new HttpException('No active account found.', HttpStatus.NOT_FOUND);

    const otp = this._generateOtp();
    await this.upstashService.redis.set(`otp:login:${identifier}`, otp, {
      ex: 300,
    });

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
    const storedOtp = await this.upstashService.redis.get<string>(
      `otp:login:${identifier}`,
    );
    if (storedOtp !== otp)
      throw new HttpException(
        'Invalid or expired OTP.',
        HttpStatus.BAD_REQUEST,
      );

    const user = await this._findUserByIdentifier(identifier);
    if (!user) throw new HttpException('User not found.', HttpStatus.NOT_FOUND);

    await this.upstashService.redis.del(`otp:login:${identifier}`);
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
