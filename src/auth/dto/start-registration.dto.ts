import { IsEmail, IsNotEmpty, IsPhoneNumber, IsString } from 'class-validator';
/* eslint-disable @typescript-eslint/no-unsafe-call */
export class StartRegistrationDto {
  @IsEmail()
  @IsNotEmpty()
  readonly email: string;

  @IsString()
  @IsNotEmpty()
  @IsPhoneNumber() // Validates E.164 format, e.g., +251911223344
  readonly phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  readonly password: string;

  @IsString()
  @IsNotEmpty()
  readonly name: string;
}
