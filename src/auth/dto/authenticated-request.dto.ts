import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user: {
    googleId: string;
    email: string;
    name: string;
  };
}
