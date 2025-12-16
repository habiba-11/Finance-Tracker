import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { UsersService } from './users.service';
import { User, UserDocument } from './schemas/user.schema';

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;
  let userModel: Model<UserDocument>;

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: 'hashedPassword123',
    toObject: jest.fn().mockReturnValue({
      _id: '507f1f77bcf86cd799439011',
      name: 'Test User',
      email: 'test@example.com',
    }),
  };

  const mockUserModel = function(userData?: any) {
    return {
      ...mockUser,
      ...userData,
      save: jest.fn().mockResolvedValue(mockUser),
    };
  } as any;

  mockUserModel.findOne = jest.fn();
  mockUserModel.findById = jest.fn();
  mockUserModel.create = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userModel = module.get<Model<UserDocument>>(getModelToken(User.name));

    // Reset mocks
    jest.clearAllMocks();
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  });

  describe('register', () => {
    it('should throw BadRequestException when name is missing', async () => {
      const body = { email: 'test@example.com', password: 'password123' };

      await expect(service.register(body)).rejects.toThrow(BadRequestException);
      await expect(service.register(body)).rejects.toThrow('Missing fields: name');
    });

    it('should throw BadRequestException when email is missing', async () => {
      const body = { name: 'Test User', password: 'password123' };

      await expect(service.register(body)).rejects.toThrow(BadRequestException);
      await expect(service.register(body)).rejects.toThrow('Missing fields: email');
    });

    it('should throw BadRequestException when password is missing', async () => {
      const body = { name: 'Test User', email: 'test@example.com' };

      await expect(service.register(body)).rejects.toThrow(BadRequestException);
      await expect(service.register(body)).rejects.toThrow('Missing fields: password');
    });

    it('should throw ConflictException when email already exists', async () => {
      const body = { name: 'Test User', email: 'test@example.com', password: 'password123' };
      
      mockUserModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      await expect(service.register(body)).rejects.toThrow(ConflictException);
      await expect(service.register(body)).rejects.toThrow('Email already exists');
    });

    it('should successfully register a new user', async () => {
      const body = { name: 'Test User', email: 'test@example.com', password: 'password123' };
      
      mockUserModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.register(body);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(result).toBeDefined();
    });
  });

  describe('login', () => {
    it('should throw BadRequestException when email is missing', async () => {
      const body = { password: 'password123' };

      await expect(service.login(body)).rejects.toThrow(BadRequestException);
      await expect(service.login(body)).rejects.toThrow('Email and password are required');
    });

    it('should throw BadRequestException when password is missing', async () => {
      const body = { email: 'test@example.com' };

      await expect(service.login(body)).rejects.toThrow(BadRequestException);
      await expect(service.login(body)).rejects.toThrow('Email and password are required');
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      const body = { email: 'test@example.com', password: 'password123' };
      
      mockUserModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.login(body)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(body)).rejects.toThrow('Invalid credentials');
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
      const body = { email: 'test@example.com', password: 'wrongpassword' };
      
      mockUserModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(body)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(body)).rejects.toThrow('Invalid credentials');
      expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashedPassword123');
    });

    it('should successfully login with correct credentials', async () => {
      const body = { email: 'test@example.com', password: 'password123' };
      
      mockUserModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(body);

      expect(result).toEqual({
        message: 'Login successful',
        userId: mockUser._id,
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword123');
    });
  });
});

