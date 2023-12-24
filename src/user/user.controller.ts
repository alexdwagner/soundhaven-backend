// src/user/user.controller.ts

import {
  Controller,
  Post,
  Patch,
  Body,
  Get,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  @Patch(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.updateUser(id, updateUserDto);
  }

  @Get(':email')
  async getUserByEmail(@Param('email') email: string) {
    return this.userService.findUserByEmail(email);
  }

  // In UserController

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  async getUserProfile(@Request() req) {
    return this.userService.getUserById(req.user.userId);
  }
}
