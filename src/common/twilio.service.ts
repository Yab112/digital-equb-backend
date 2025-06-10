import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Twilio from 'twilio';
import { LoggerService } from './logger/logger.service';

@Injectable()
export class TwilioService {
  private readonly twilioClient: Twilio.Twilio;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');

    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials are not configured.');
    }
    this.twilioClient = Twilio(accountSid, authToken);
    this.logger.setContext(TwilioService.name);
  }

  async sendSms(to: string, body: string): Promise<void> {
    const from = this.configService.get<string>('TWILIO_PHONE_NUMBER');
    try {
      await this.twilioClient.messages.create({ body, from, to });
      this.logger.log(`SMS sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${to}`, error);
      throw error; // Re-throw the error to be handled by the calling service
    }
  }
}
