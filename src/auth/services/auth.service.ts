import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
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

  private sanitizeUser(user: Omit<User, 'password'>) {
    const sanitized = { ...user };
    return sanitized;
  }

  async validateUser(
    email: string,
    pass: string,
  ): Promise<Omit<User, 'password'> | null> {
    const user = await this.userService.findUserByEmail(email);
    if (!user) {
      throw new NotFoundException(`User not found`);
    }

    const passwordIsValid = await bcrypt.compare(pass, user.password);
    if (!passwordIsValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async login(user: Omit<User, 'password'>) {
    const accessToken = await this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);

    console.log(`User ${user.id} logged in successfully`);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: this.sanitizeUser(user),
    };
  }

  async generateAccessToken(user: Omit<User, 'password'>) {
    const payload = { email: user.email, sub: user.id };

    console.log(
      'ACCESS_TOKEN_SECRET (generation):',
      process.env.ACCESS_TOKEN_SECRET,
    ); // Add this logging

    return this.jwtService.sign(payload, {
      secret: process.env.ACCESS_TOKEN_SECRET,
      expiresIn: '60m',
    });
  }

  async validateToken(token: string): Promise<{ isValid: boolean; user?: any }> {
    try {
      const decoded = this.jwtService.verify(token, {
        secret: process.env.ACCESS_TOKEN_SECRET,
      });

      const user = await this.userService.getUserIdFromTokenSub(decoded.sub);

      if (!user) {
        console.log(`No user found for token sub: ${decoded.sub}`);
        return { isValid: false };
      }

      return { isValid: true, user: this.sanitizeUser(user) };
    } catch (error) {
      console.error('Error validating token:', error);
      return { isValid: false };
    }
  }

  async generateRefreshToken(user: Omit<User, 'password'>) {
    const payload = { userId: user.id };
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.REFRESH_TOKEN_SECRET,
      expiresIn: '7d',
    });

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresIn: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return refreshToken;
  }

  async refreshAccessToken(refreshToken: string) {
    console.log('Refreshing token:', refreshToken);

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    console.log('Stored token found:', storedToken);

    if (!storedToken || new Date() > storedToken.expiresIn) {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: storedToken.userId },
    });

    console.log('User found:', user?.id);

    if (!user) {
      throw new UnauthorizedException(
        'User not found for the provided refresh token.',
      );
    }

    // Generate new access token
    const newAccessToken = this.jwtService.sign(
      { email: user.email, sub: user.id },
      {
        secret: process.env.ACCESS_TOKEN_SECRET,
        expiresIn: '360m', // or whatever expiration time you prefer
      },
    );

    console.log('New access token generated');

    // Generate new refresh token (implement refresh token rotation)
    const newRefreshToken = await this.generateRefreshToken(user);

    console.log('New refresh token generated');

    // Invalidate old refresh token
    await this.prisma.refreshToken.delete({
      where: { token: refreshToken },
    });

    console.log('Old refresh token invalidated');

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async revokeRefreshToken(token: string) {
    try {
      const result = await this.prisma.refreshToken.deleteMany({
        where: { token },
      });

      if (result.count > 0) {
        console.log('Refresh token revoked:', token);
      } else {
        console.warn('Refresh token not found for revocation:', token);
      }
    } catch (error) {
      console.error('Error revoking refresh token:', error);
      throw new Error(`Failed to revoke refresh token. Details: ${error.message}`);
    }
  }
}
