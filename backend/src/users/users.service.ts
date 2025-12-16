import { Injectable, BadRequestException, ConflictException, UnauthorizedException, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';

// ============================================
// REPOSITORY PATTERN: User Data Access
// ============================================
// Repository interface for users
interface IUserRepository {
  findByEmail(email: string): Promise<UserDocument | null>;
  create(userData: any): Promise<UserDocument>;
  findById(id: string): Promise<UserDocument | null>;
}

// Mongoose implementation of User Repository
class UserRepository implements IUserRepository {
  constructor(private readonly userModel: Model<UserDocument>) {}

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase().trim() }).exec();
  }

  async create(userData: any): Promise<UserDocument> {
    const user = new this.userModel(userData);
    return user.save();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }
}

@Injectable()
export class UsersService {
  private userRepository: IUserRepository;
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {
    // Initialize repository
    this.userRepository = new UserRepository(this.userModel);
  }

  async register(createUserDto: CreateUserDto) {
    const { name, email, password } = createUserDto;

    // Validate required fields
    const missingFields: string[] = [];
    if (!name) missingFields.push('name');
    if (!email) missingFields.push('email');
    if (!password) missingFields.push('password');
    
    if (missingFields.length > 0) {
      throw new BadRequestException(`Missing fields: ${missingFields.join(', ')}`);
    }

    try {
      // Use Repository Pattern to check if user exists
      const exists = await this.userRepository.findByEmail(email);
      if (exists) {
        throw new ConflictException('Email already exists');
      }

      const hashed = await bcrypt.hash(password, 10);

      // Use Repository Pattern to create user
      const userData = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash: hashed,
      };

      const savedUser = await this.userRepository.create(userData);
      
      // Exclude passwordHash from response
      const { passwordHash, ...userResponse } = savedUser.toObject();
      
      this.logger.log(`User registered successfully: ${email}`);
      return userResponse;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Error registering user: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to register user');
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Validate required fields
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    try {
      // Use Repository Pattern to find user
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) {
        throw new UnauthorizedException('Invalid credentials');
      }

      this.logger.log(`User logged in successfully: ${email}`);
      return {
        message: 'Login successful',
        userId: user._id,
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Error during login: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to login');
    }
  }
}
