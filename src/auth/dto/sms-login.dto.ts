/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsNotEmpty, IsPhoneNumber, IsString } from 'class-validator';

export class SmsLoginDto {
  @IsString()
  @IsNotEmpty()
  @IsPhoneNumber('ET') // Specify the region, e.g., 'ET' for Ethiopia
  readonly phoneNumber: string;
}
