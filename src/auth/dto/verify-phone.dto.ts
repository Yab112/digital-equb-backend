import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsPhoneNumber, IsString, Length } from 'class-validator';
/* eslint-disable @typescript-eslint/no-unsafe-call */
export class VerifyPhoneDto {
  @ApiProperty({
    example: '+251911223344',
    description: 'User phone number in E.164 format',
  })
  @IsString()
  @IsNotEmpty()
  @IsPhoneNumber()
  readonly phoneNumber: string;

  @ApiProperty({
    example: '123456',
    description: '6-digit OTP code as a string',
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'OTP must be 6 digits and a string' })
  readonly otp: string;
}
