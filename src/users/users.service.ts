import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ email });
  }

  async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ phoneNumber });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ googleId });
  }

  async create(dto: {
    email: string;
    phoneNumber: string;
    password: string;
  }): Promise<User> {
    const newUser = this.usersRepository.create({
      email: dto.email,
      phoneNumber: dto.phoneNumber,
      password: dto.password,
      name: null,
      googleId: null,
      isActive: false,
      isEmailVerified: false,
      isPhoneNumberVerified: false,
    });
    return this.usersRepository.save(newUser);
  }

  async createWithGoogle(
    googleId: string,
    email: string,
    name: string,
  ): Promise<User> {
    const newUser = this.usersRepository.create({
      googleId,
      email,
      name,
      isActive: true,
      isEmailVerified: true,
    });
    return this.usersRepository.save(newUser);
  }

  async update(id: string, updates: Partial<User>): Promise<User> {
    const result = await this.usersRepository.update(id, updates);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID "${id}" not found.`);
    }
    // TypeORM's update method doesn't return the entity, so we must find it again.
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found.`);
    }
    return user;
  }
}
