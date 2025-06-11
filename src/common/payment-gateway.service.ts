import { Injectable } from '@nestjs/common';
import { LoggerService } from './logger/logger.service';

interface PaymentResponse {
  success: boolean;
  transactionId: string;
  message: string;
}

@Injectable()
export class PaymentGatewayService {
  constructor(private readonly logger: LoggerService) {
    this.logger.setContext(PaymentGatewayService.name);
  }

  /**
   * Simulates processing a payment through an external gateway.
   * It has a 1.5-second delay and a 90% chance of success.
   */
  async processPayment(amount: number): Promise<PaymentResponse> {
    this.logger.log(`Processing payment of ${amount}...`);

    // 1. Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // 2. Simulate random success or failure (90% success rate)
    const isSuccess = Math.random() > 0.1;
    const mockTransactionId = `mock_txn_${Date.now()}`;

    if (isSuccess) {
      this.logger.log(
        `Payment successful. Transaction ID: ${mockTransactionId}`,
      );
      return {
        success: true,
        transactionId: mockTransactionId,
        message: 'Payment processed successfully.',
      };
    } else {
      this.logger.warn(`Payment failed. Transaction ID: ${mockTransactionId}`);
      return {
        success: false,
        transactionId: mockTransactionId,
        message: 'Payment declined by the bank.',
      };
    }
  }
}
