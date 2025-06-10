import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggerService } from './common/logger/logger.service';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new LoggerService(),
  });
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(3000);
}
bootstrap();
