import { IsNotEmpty, IsPhoneNumber } from 'class-validator';

export class ResendPhoneVerificationDto {
  @IsNotEmpty()
  @IsPhoneNumber()
  phoneNumber: string;
}
