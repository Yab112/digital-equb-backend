import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Res,
  UseGuards,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';

// DTO Imports
import { StartRegistrationDto } from './dto/start-registration.dto';
import { VerifyPhoneDto } from './dto/verify-phone.dto';
import { RequestLoginOtpDto } from './dto/request-login-otp.dto';
import { VerifyLoginOtpDto } from './dto/verify-login-otp.dto';
import { LoginWithPasswordDto } from './dto/login-with-password.dto';

// Helper Type for Authenticated Google Request
interface AuthenticatedRequest extends Request {
  user: {
    googleId: string;
    email: string;
    name: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // --- GOOGLE OAUTH ROUTES ---
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth(): void {
    // Initiates the Google OAuth2 login flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    const user = await this.authService.validateOAuthUser(req.user);
    const accessToken = this.authService.generateJwt(user);
    this._setTokenCookie(res, accessToken);
    res.redirect('http://localhost:3001/dashboard'); // Redirect to your frontend
  }

  // --- COMBINED REGISTRATION ROUTES ---
  @Post('register/start')
  async startRegistration(
    @Body() dto: StartRegistrationDto,
  ): Promise<{ message: string }> {
    await this.authService.startRegistration(
      dto.email,
      dto.phoneNumber,
      dto.password,
      dto.name,
    );
    return { message: 'Verification OTP sent to your phone number.' };
  }

  @Post('register/verify-phone')
  async verifyPhone(@Body() dto: VerifyPhoneDto): Promise<{ message: string }> {
    await this.authService.verifyPhoneNumber(dto.phoneNumber, dto.otp);
    return {
      message:
        'Phone number verified. Please check your email for the final step.',
    };
  }

  @Get('register/verify-email')
  async verifyEmailAndActivate(
    @Query('token') token: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!token)
      throw new HttpException(
        'Verification token is required.',
        HttpStatus.BAD_REQUEST,
      );

    const user = await this.authService.verifyEmailAndActivate(token);
    const accessToken = this.authService.generateJwt(user);
    this._setTokenCookie(res, accessToken);

    return {
      message: 'Account activated successfully. You are now logged in.',
    };
  }

  // --- UNIFIED LOGIN ROUTES ---
  @Post('login/request-otp')
  async requestLoginOtp(
    @Body() dto: RequestLoginOtpDto,
  ): Promise<{ message: string }> {
    await this.authService.requestLoginOtp(dto.identifier);
    return {
      message: 'Login OTP has been sent to your registered email or phone.',
    };
  }

  @Post('login/verify-otp')
  async verifyLoginOtp(
    @Body() dto: VerifyLoginOtpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.verifyLoginOtp(dto.identifier, dto.otp);
    const accessToken = this.authService.generateJwt(user);
    this._setTokenCookie(res, accessToken);
    return { message: 'Login successful.' };
  }

  @Post('login/password')
  async loginWithPassword(
    @Body() dto: LoginWithPasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.loginWithPassword(
      dto.email,
      dto.password,
    );
    const accessToken = this.authService.generateJwt(user);
    this._setTokenCookie(res, accessToken);
    return { message: 'Login successful.' };
  }

  // --- HELPER METHOD ---
  private _setTokenCookie(res: Response, accessToken: string): void {
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });
  }
}
