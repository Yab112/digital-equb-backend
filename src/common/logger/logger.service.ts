import { Injectable, Scope, ConsoleLogger } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService extends ConsoleLogger {
  log(message: any, context?: string) {
    super.log(`✅ ${message}`, context);
  }
  error(message: any, stack?: string, context?: string) {
    super.error(`❌ ${message}`, stack, context);
  }
  warn(message: any, context?: string) {
    super.warn(`⚠️ ${message}`, context);
  }
  debug(message: any, context?: string) {
    super.debug(`🐞 ${message}`, context);
  }
}
