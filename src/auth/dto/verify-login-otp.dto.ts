import { IsNotEmpty, IsString, Length } from 'class-validator';
/* eslint-disable @typescript-eslint/no-unsafe-call */
export class VerifyLoginOtpDto {
  @IsString()
  @IsNotEmpty()
  readonly identifier: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'OTP must be 6 digits' })
  readonly otp: string;
}
