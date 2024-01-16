// src/auth/auth.service.ts

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    email: string,
    pass: string,
  ): Promise<Omit<User, 'password'> | null> {
    const user = await this.userService.findUserByEmail(email);
    if (user && (await bcrypt.compare(pass, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(payload, {
        expiresIn: '7d', // Set longer expiration for refresh token
      }),
    };
  }

  async generateAccessToken(user: any) {
    const payload = { email: user.email, sub: user.id };
    return this.jwtService.sign(payload);
  }

  async generateRefreshToken(user: any) {
    const refreshToken = this.jwtService.sign(
      {},
      {
        secret: 'refresh-secret', // Use a different secret or load from .env
        expiresIn: '7d',
      },
    );

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresIn: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
    });

    return refreshToken;
  }

  async refreshAccessToken(refreshToken: string) {
    // Validate the refresh token
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!storedToken || new Date() > storedToken.expiresIn) {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    // Generate new access token
    const user = await this.prisma.user.findUnique({
      where: { id: storedToken.userId },
    });

    if (!user) {
      throw new UnauthorizedException(
        'User not found for the provided refresh token.',
      );
    }

    return this.jwtService.sign({ email: user.email, sub: user.id });
  }

  async revokeRefreshToken(token: string) {
    await this.prisma.refreshToken.delete({ where: { token } });
  }
}
