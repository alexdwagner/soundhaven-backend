import { Request } from 'express'; // Make sure to import Request from express
import {
  Controller,
  Req,
  Post,
  Body,
  Headers,
  UnauthorizedException,
  BadRequestException,
  UseGuards
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from '../../user/dto/create-user.dto';
import { LoginDto } from '../dto/login.dto';
import { TokenDto } from '../dto/token.dto';
import { ApiBody, ApiTags, ApiOperation } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
    private jwtService: JwtService,
  ) { }

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    const newUser = await this.userService.createUser(createUserDto);
    const accessToken = await this.authService.generateAccessToken(newUser);
    return { user: newUser, accessToken };
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    console.log('Received Login DTO:', loginDto);
    console.log('Type of email:', typeof loginDto.email);
    console.log('Type of password:', typeof loginDto.password);

    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const response = await this.authService.login(user);
    console.log('Sending login response:', response); // Log the final response
    return response;
  }

  @Post('logout')
  async logout(@Headers('authorization') authHeader: string) {
    const token = authHeader?.split(' ')[1]; // Extract the token

    // Log to confirm token extraction
    console.log(`Extracted token for logout: ${token}`);

    if (!token) {
      throw new BadRequestException('No token provided for logout.');
    }

    await this.authService.revokeRefreshToken(token);
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