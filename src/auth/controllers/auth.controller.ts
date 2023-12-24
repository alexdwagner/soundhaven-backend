import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { UserService } from 'src/user/user.service';
import { CreateUserDto } from '../../user/dto/create-user.dto';
import { LoginDto } from '../dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    const user = await this.userService.createUser(createUserDto);
    // Optionally, you can generate a token for the user right after registration
    const access_token = await this.authService.generateAccessToken(user);
    return { user, access_token };
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

    return this.authService.login(user);
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
