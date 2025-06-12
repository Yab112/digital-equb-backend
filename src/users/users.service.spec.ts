import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { Repository } from 'typeorm';

// Create a mock user object for our tests
const mockUser: User = {
  id: 'user-uuid-123',
  email: 'test@example.com',
  phoneNumber: '+251911223344',
  name: 'Test User',
  isActive: true,
  isEmailVerified: true,
  isPhoneNumberVerified: true,
  googleId: null,
  password: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ownedEqubs: [],
  memberships: [],
};

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOneBy: jest.fn().mockResolvedValue(mockUser),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByEmail', () => {
    it('should return a user if found by email', async () => {
      const email = 'test@example.com';
      const result = await service.findByEmail(email);

      expect(jest.spyOn(repository, 'findOneBy')).toHaveBeenCalledWith({
        email,
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if no user is found', async () => {
      jest.spyOn(repository, 'findOneBy').mockResolvedValue(null);
      const result = await service.findByEmail('notfound@example.com');
      expect(result).toBeNull();
    });
  });
});
