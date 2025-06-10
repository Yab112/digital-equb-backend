import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ googleId });
  }

  async createWithGoogle(
    googleId: string,
    email: string,
    name: string,
  ): Promise<User> {
    const newUser = this.usersRepository.create({ googleId, email, name });
    return this.usersRepository.save(newUser);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ email });
  }
}
