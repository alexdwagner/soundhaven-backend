// src/user/user.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (!createUserDto.name) {
      throw new BadRequestException('Name is required');
    }

    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    console.log('Creating user with email:', createUserDto.email);
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const newUser = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        password: hashedPassword,
        name: createUserDto.name,
      },
    });
    console.log('User created with ID:', newUser.id);
    return newUser;
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    return this.prisma.user.update({
      where: { id: Number(id) },
      data: updateUserDto,
    });
  }

  async findUserByEmail(email: string): Promise<User | null> {
    // Validate that email is a string
    if (typeof email !== 'string') {
      console.error(
        `Invalid email type received in findUserByEmail: ${typeof email}`,
      );
      throw new BadRequestException('Invalid email provided');
    }

    console.log(`Finding user by email: ${email}`);
    try {
      return await this.prisma.user.findUnique({ where: { email } });
    } catch (error) {
      console.error(`Error finding user by email: ${email}`, error);
      throw new InternalServerErrorException('Error fetching user data');
    }
  }

  async getUserIdFromTokenSub(tokenSub: string): Promise<User> {
    const numericId = parseInt(tokenSub, 10); // Convert id to number
    if (isNaN(numericId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: numericId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: Number(id) },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.delete({ where: { id: Number(id) } });
    return { message: 'User deleted successfully' };
  }
}
