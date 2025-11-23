import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';


@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async register(body: any) {
    const { name, email, password } = body;

    // Declarative validation
    const missing = ['name', 'email', 'password'].filter(
      (f) => !body[f]
    );
    if (missing.length > 0) {
      throw new BadRequestException(
        `Missing fields: ${missing.join(', ')}`
      );
    }

    const exists = await this.userModel.findOne({ email });
    if (exists) throw new BadRequestException('Email already exists');

    const hashed = await bcrypt.hash(password, 10);

    const user = new this.userModel({
      name,
      email: email.trim().toLowerCase(),
      passwordHash: hashed,
    });

    return user.save();
  }
  async login(body: any) {
    const { email, password } = body;

    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      throw new BadRequestException('Invalid credentials');
    }

    return {
      message: 'Login successful',
      userId: user._id,
    };
  }
}
