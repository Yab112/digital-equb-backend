import { IsNotEmpty, IsString } from 'class-validator';
/* eslint-disable @typescript-eslint/no-unsafe-call */
export class RequestLoginOtpDto {
  @IsString()
  @IsNotEmpty()
  // This can be either an email or a phone number
  readonly identifier: string;
}
