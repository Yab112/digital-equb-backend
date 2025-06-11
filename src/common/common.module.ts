import { Global, Module } from '@nestjs/common';
import { LoggerService } from './logger/logger.service';
import { EmailService } from './email.service';
import { TwilioService } from './twilio.service';

@Global()
@Module({
  providers: [LoggerService, TwilioService, EmailService],
  exports: [LoggerService, TwilioService, EmailService],
})
export class CommonModule {}
