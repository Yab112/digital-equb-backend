import { ApiProperty } from '@nestjs/swagger';

export class OAuthUserDetails {
  @ApiProperty({
    example: '1234567890',
    description: 'Google user ID',
  })
  googleId: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  email: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'User full name',
  })
  name: string;
}
