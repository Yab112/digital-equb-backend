import { randomInt } from 'crypto';
import { isEmail, isPhoneNumber } from 'class-validator';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';

export function generateOtp(): string {
  return randomInt(100000, 999999).toString();
}

export async function findUserByIdentifier(
  usersService: UsersService,
  identifier: string,
): Promise<User | null> {
  if (isEmail(identifier)) return usersService.findByEmail(identifier);
  if (isPhoneNumber(identifier, 'ET'))
    return usersService.findByPhoneNumber(identifier);
  return null;
}
