import { Global, Module } from '@nestjs/common';
import { LoggerService } from './logger/logger.service';

@Global()
@Module({
  providers: [LoggerService],
  exports: [LoggerService],
})
export class CommonModule {}
