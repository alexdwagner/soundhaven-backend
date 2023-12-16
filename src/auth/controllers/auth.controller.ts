import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { CreateUserDto } from '../../user/dto/create-user.dto';
import { LoginDto } from '../dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    // Handle user registration
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      access_token: await this.authService.generateAccessToken(user),
      refresh_token: await this.authService.generateRefreshToken(user),
    };
  }

  @Post('logout')
  async logout(@Body() body: { refreshToken: string }) {
    await this.authService.revokeRefreshToken(body.refreshToken);
    return { message: 'Logged out successfully.' };
  }

  @Post('refresh')
  async refresh(@Body() body: { refreshToken: string }) {
    return {
      access_token: await this.authService.refreshAccessToken(
        body.refreshToken,
      ),
    };
  }
}
