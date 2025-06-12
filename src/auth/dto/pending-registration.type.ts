import { ApiProperty } from '@nestjs/swagger';

export class PendingRegistration {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  email: string;

  @ApiProperty({
    example: '+251911223344',
    description: 'User phone number in E.164 format',
  })
  phoneNumber: string;

  @ApiProperty({
    example: 'hashedpassword',
    description: 'User password (hashed)',
  })
  password: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'User full name',
  })
  name: string;

  @ApiProperty({
    example: false,
    description: 'Is phone verified?',
  })
  phoneVerified: boolean;

  @ApiProperty({
    example: false,
    description: 'Is email verified?',
  })
  emailVerified: boolean;
}
