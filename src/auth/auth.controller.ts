import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { AuthenticatedRequest } from './dto/authenticated-request.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth(): void {
    // This route initiates the Google OAuth2 login flow via the guard
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    const user = await this.authService.validateOAuthUser(req.user);
    const accessToken = this.authService.generateJwt(user);

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      sameSite: 'lax',
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    // Redirect to your frontend application
    res.redirect('http://localhost:3001/dashboard');
  }
}
