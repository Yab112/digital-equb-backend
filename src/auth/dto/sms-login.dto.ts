/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsPhoneNumber, IsString } from 'class-validator';

export class SmsLoginDto {
  @ApiProperty({
    example: '+251911223344',
    description: 'User phone number in E.164 format',
  })
  @IsString()
  @IsNotEmpty()
  @IsPhoneNumber('ET') // Specify the region, e.g., 'ET' for Ethiopia
  readonly phoneNumber: string;
}
