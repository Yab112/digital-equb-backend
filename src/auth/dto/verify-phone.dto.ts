import { IsNotEmpty, IsPhoneNumber, IsString, Length } from 'class-validator';
/* eslint-disable @typescript-eslint/no-unsafe-call */
export class VerifyPhoneDto {
  @IsString()
  @IsNotEmpty()
  @IsPhoneNumber()
  readonly phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'OTP must be 6 digits and a string' })
  readonly otp: string;
}
