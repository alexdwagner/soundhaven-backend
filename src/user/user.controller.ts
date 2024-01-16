import {
  Controller,
  Post,
  Patch,
  Body,
  Get,
  Param,
  UseGuards,
  Req,
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
}
