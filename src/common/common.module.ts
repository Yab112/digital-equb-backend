import { Global, Module } from '@nestjs/common';
import { LoggerService } from './logger/logger.service';
import { EmailService } from './email.service';
import { TwilioService } from './twilio.service';
import { UpstashService } from './upstash.service';
import { PaymentGatewayService } from './payment-gateway.service';

@Global()
@Module({
  providers: [
    LoggerService,
    TwilioService,
    EmailService,
    UpstashService,
    PaymentGatewayService,
  ],
  exports: [
    LoggerService,
    TwilioService,
    EmailService,
    UpstashService,
    PaymentGatewayService,
  ],
})
export class CommonModule {}
