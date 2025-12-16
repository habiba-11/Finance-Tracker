import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.usersService.register(createUserDto);
  }
  
  @Post('login')
  @HttpCode(200)
  async login(@Body() loginDto: LoginDto) {
    return this.usersService.login(loginDto);
  }
}

