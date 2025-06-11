import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginWithPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  readonly email: string;

  @IsString()
  @IsNotEmpty()
  readonly password: string;
}
