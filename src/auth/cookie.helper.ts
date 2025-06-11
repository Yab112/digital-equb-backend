import { Response } from 'express';

export function setTokenCookie(res: Response, accessToken: string): void {
  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  });
}
