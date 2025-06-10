import { IsNotEmpty, IsPhoneNumber, IsString, Length } from 'class-validator';
/* eslint-disable @typescript-eslint/no-unsafe-call */
export class SmsVerifyDto {
  @IsString()
  @IsNotEmpty()
  @IsPhoneNumber()
  readonly phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 6) // OTP will be 6 digits
  readonly otp: string;
}
