import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';
/* eslint-disable @typescript-eslint/no-unsafe-call */
export class VerifyLoginOtpDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email or phone number',
  })
  @IsString()
  @IsNotEmpty()
  readonly identifier: string;

  @ApiProperty({
    example: '123456',
    description: '6-digit OTP code as a string',
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'OTP must be 6 digits' })
  readonly otp: string;
}
