import { ApiProperty } from '@nestjs/swagger';
import { Request } from 'express';

export class AuthenticatedRequest {
  @ApiProperty({
    example: {
      googleId: '1234567890',
      email: 'user@example.com',
      name: 'John Doe',
    },
    description: 'Authenticated Google user object',
  })
  user: {
    googleId: string;
    email: string;
    name: string;
  };
}
