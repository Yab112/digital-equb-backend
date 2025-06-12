import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
/* eslint-disable @typescript-eslint/no-unsafe-call */
export class RequestLoginOtpDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email or phone number',
  })
  @IsString()
  @IsNotEmpty()
  // This can be either an email or a phone number
  readonly identifier: string;
}
