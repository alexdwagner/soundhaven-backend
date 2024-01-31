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
  async validateToken(token: string) {
    try {
      const decoded = this.jwtService.verify(token);

      if (!decoded.userId) {
        throw new UnauthorizedException('Invalid token - no user ID');
      }

      const user = await this.userService.findUserById(decoded.userId);

      if (!user) {
        throw new NotFoundException('No user found');
      }

      return this.sanitizeUser(user);
    } catch (error) {
      throw new UnauthorizedException('Token validation failed');
    }
  }

  private sanitizeUser(user: User) {
    // Omit sensitive fields like password
    const { password, ...sanitized } = user;

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
    if (!user) {
      throw new Error('User object is required for login');
    }
    console.log(`Generating access token for user: ${user.email}`);
    const accessToken = await this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);
    console.log(`Access and refresh tokens generated for user: ${user.email}`);
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user,
    };
  }

  async generateAccessToken(user: Omit<User, 'password'>) {
    const payload = { email: user.email, sub: user.id };
    return this.jwtService.sign(payload, {
      secret: process.env.ACCESS_TOKEN_SECRET,
      expiresIn: '15m',
    });
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
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!storedToken || new Date() > storedToken.expiresIn) {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: storedToken.userId },
    });

    if (!user) {
      throw new UnauthorizedException(
        'User not found for the provided refresh token.',
      );
    }

    return this.jwtService.sign(
      { email: user.email, sub: user.id },
      {
        secret: process.env.ACCESS_TOKEN_SECRET, // Use ACCESS_TOKEN_SECRET here
      },
    );
  }

  async revokeRefreshToken(token: string) {
    try {
      // Log to indicate the search for the existing token
      console.log(`Looking up refresh token: ${token}`);

      const existingToken = await this.prisma.refreshToken.findUnique({
        where: { token },
      });

      // Log to warn if token not found and return early
      if (!existingToken) {
        console.warn('Refresh token not found for revocation:', token);
        return;
      }

      // Log to indicate the deletion of the token
      console.log(`Deleting refresh token: ${token}`);
      await this.prisma.refreshToken.delete({
        where: { token },
      });

      // Log to confirm successful revocation
      console.log('Refresh token revoked:', token);
    } catch (error) {
      console.error('Error revoking refresh token:', error);
      throw new Error(
        `Failed to revoke refresh token. Details: ${error.message}`,
      );
    }
  }
}
