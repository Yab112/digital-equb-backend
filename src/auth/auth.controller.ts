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
  Delete,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { setTokenCookie } from './cookie.helper';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

// DTO Imports
import { StartRegistrationDto } from './dto/start-registration.dto';
import { VerifyPhoneDto } from './dto/verify-phone.dto';
import { ResendPhoneVerificationDto } from './dto/resend-phone-verification.dto';
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

@ApiTags('Authentication')
@Controller('auth')
@ApiBearerAuth()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // --- GOOGLE OAUTH ROUTES ---
  @Get('google')
  @ApiOperation({ summary: 'Initiate Google OAuth2 login flow' })
  @ApiResponse({ status: 200, description: 'Redirects to Google login.' })
  @UseGuards(AuthGuard('google'))
  googleAuth(): void {
    // Initiates the Google OAuth2 login flow
  }

  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth2 callback' })
  @ApiResponse({
    status: 302,
    description: 'Redirects to dashboard after successful login.',
  })
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    const user = await this.authService.validateOAuthUser(req.user);
    const accessToken = this.authService.generateJwt(user);
    setTokenCookie(res, accessToken);
    res.redirect('http://localhost:3001/dashboard'); // Redirect to your frontend
  }

  // --- COMBINED REGISTRATION ROUTES ---
  @Post('register/start')
  @ApiOperation({ summary: 'Start registration (send OTP to phone)' })
  @ApiResponse({ status: 201, description: 'Verification OTP sent.' })
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

  @Post('register/resend-otp')
  @ApiOperation({ summary: 'Resend phone verification OTP' })
  @ApiResponse({
    status: 201,
    description: 'A new verification OTP has been sent.',
  })
  async resendOtp(
    @Body() dto: ResendPhoneVerificationDto,
  ): Promise<{ message: string }> {
    await this.authService.resendPhoneVerificationOtp(dto.phoneNumber);
    return { message: 'A new verification OTP has been sent.' };
  }

  @Post('register/verify-phone')
  @ApiOperation({ summary: 'Verify phone number with OTP' })
  @ApiResponse({ status: 201, description: 'Phone number verified.' })
  async verifyPhone(@Body() dto: VerifyPhoneDto): Promise<{ message: string }> {
    await this.authService.verifyPhoneNumber(dto.phoneNumber, dto.otp);
    return {
      message:
        'Phone number verified. Please check your email for the final step.',
    };
  }

  @Get('register/verify-email')
  @ApiOperation({ summary: 'Verify email and activate account' })
  @ApiResponse({ status: 200, description: 'Account activated and logged in.' })
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
    setTokenCookie(res, accessToken);

    return {
      message: 'Account activated successfully. You are now logged in.',
    };
  }

  // --- UNIFIED LOGIN ROUTES ---
  @Post('login/request-otp')
  @ApiOperation({ summary: 'Request OTP for login (email or phone)' })
  @ApiResponse({ status: 201, description: 'Login OTP sent.' })
  async requestLoginOtp(
    @Body() dto: RequestLoginOtpDto,
  ): Promise<{ message: string }> {
    await this.authService.requestLoginOtp(dto.identifier);
    return {
      message: 'Login OTP has been sent to your registered email or phone.',
    };
  }

  @Post('login/verify-otp')
  @ApiOperation({ summary: 'Verify login OTP' })
  @ApiResponse({ status: 200, description: 'Login successful.' })
  async verifyLoginOtp(
    @Body() dto: VerifyLoginOtpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.verifyLoginOtp(dto.identifier, dto.otp);
    const accessToken = this.authService.generateJwt(user);
    setTokenCookie(res, accessToken);
    return { message: 'Login successful.' };
  }

  @Post('login/password')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful.' })
  async loginWithPassword(
    @Body() dto: LoginWithPasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.loginWithPassword(
      dto.email,
      dto.password,
    );
    const accessToken = this.authService.generateJwt(user);
    setTokenCookie(res, accessToken);
    return { message: 'Login successful.' };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout (clear access token cookie)' })
  @ApiResponse({ status: 200, description: 'Logged out successfully.' })
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token');
    return { message: 'Logged out successfully.' };
  }

  @Delete('delete-account')
  @ApiOperation({ summary: 'Delete the authenticated user account' })
  @ApiResponse({ status: 200, description: 'Account deleted successfully.' })
  @UseGuards(AuthGuard('jwt'))
  async deleteAccount(@Req() req: Request) {
    // Use a type assertion to ensure req.user is typed
    const user = req.user as { id?: string };
    const userId = user && typeof user.id === 'string' ? user.id : null;
    if (!userId) {
      throw new HttpException(
        'User not found in request.',
        HttpStatus.UNAUTHORIZED,
      );
    }
    await this.authService.deleteAccount(userId);
    return { message: 'Account deleted successfully.' };
  }
}
