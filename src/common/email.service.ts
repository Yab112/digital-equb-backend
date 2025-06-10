import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from './logger/logger.service';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly transporter: Transporter;
  private readonly fromEmail: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(EmailService.name);
    this.fromEmail = this.configService.get<string>(
      'EMAIL_FROM',
      'noreply@default.com',
    );

    const host = this.configService.get<string>('EMAIL_HOST');
    const port = this.configService.get<number>('EMAIL_PORT');
    const user = this.configService.get<string>('EMAIL_USER');
    const pass = this.configService.get<string>('EMAIL_PASSWORD');

    if (!host || !port || !user || !pass) {
      this.logger.warn(
        'Email service is not configured. Emails will not be sent.',
      );
      // Create a dummy transporter if not configured
      this.transporter = nodemailer.createTransport({ jsonTransport: true });
      return;
    }

    // Initialize the Nodemailer transporter with Mailtrap credentials
    this.transporter = nodemailer.createTransport({
      host,
      port,
      auth: { user, pass },
    });

    this.logger.log('Email service configured and ready.');
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const verificationLink = `http://localhost:3000/auth/register/verify-email?token=${token}`;

    const mailOptions = {
      from: `"Digital Equb" <${this.fromEmail}>`,
      to: to,
      subject: 'Verify Your Email Address',
      html: `
        <p>Hello,</p>
        <p>Thank you for registering. Please verify your email by clicking the link below:</p>
        <a href="${verificationLink}" target="_blank">Verify My Email</a>
        <p>This link will expire in 1 hour.</p>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Verification email sent to ${to}. It will appear in your Mailtrap inbox.`,
      );
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${to}`, error);
      // Re-throw the error to be handled by the calling service
      throw new Error('Could not send verification email.');
    }
  }

  async sendLoginOtp(to: string, otp: string): Promise<void> {
    const mailOptions = {
      from: `"Digital Equb" <${this.fromEmail}>`,
      to: to,
      subject: 'Your Login OTP',
      html: `
        <p>Hello,</p>
        <p>Your one-time password (OTP) for logging in is:</p>
        <h2><b>${otp}</b></h2>
        <p>This OTP will expire in 5 minutes.</p>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Login OTP email sent to ${to}. It will appear in your Mailtrap inbox.`,
      );
    } catch (error) {
      this.logger.error(`Failed to send login OTP to ${to}`, error);
      throw new Error('Could not send login OTP.');
    }
  }
}
