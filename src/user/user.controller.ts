import {
  Controller,
  Post,
  Patch,
  Body,
  Get,
  Param,
  UseGuards,
  Req,
  Delete,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Request } from 'express';
import { UnauthorizedException } from '@nestjs/common';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    console.log('Received registration request for:', createUserDto.email);

    try {
      const newUser = await this.userService.createUser(createUserDto);
      console.log('Created new user:', newUser.email);
      return newUser;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw new BadRequestException('User already exists with this email');
      }
      throw error;
    }
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

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  async getUserProfile(@Req() req: Request) {
    // Adjust the type assertion
    const user = req.user as { id: string; email: string; name?: string };
    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.userService.getUserById(user.id); // Use 'id' instead of 'userId'
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    return this.userService.deleteUser(id);
  }
}
