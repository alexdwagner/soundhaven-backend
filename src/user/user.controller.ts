// src/user/user.controller.ts

import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Post()
    async createUser(@Body() createUserDto: CreateUserDto) {
        return this.userService.createUser(createUserDto);
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
