import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsPhoneNumber } from 'class-validator';

export class ResendPhoneVerificationDto {
  @ApiProperty({
    example: '+251911223344',
    description: 'User phone number in E.164 format',
  })
  @IsNotEmpty()
  @IsPhoneNumber()
  phoneNumber: string;
}
