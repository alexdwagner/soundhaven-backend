import { Request } from 'express';
import {
  Controller,
  Req,
  Post,
  Body,
  Headers,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from '../../user/dto/create-user.dto';
import { LoginDto } from '../dto/login.dto';
import { TokenDto } from '../dto/token.dto';
import { ApiBody, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RequestWithUser } from '../interfaces/request-with-user.interface';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: CreateUserDto })
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    const newUser = await this.userService.createUser(createUserDto);
    const accessToken = await this.authService.generateAccessToken(newUser);
    return { user: newUser, accessToken };
  }

  @ApiOperation({ summary: 'Log in a user' })
  @ApiBody({ type: LoginDto })
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

  @ApiOperation({ summary: 'Log out a user' })
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(
    @Req() req: RequestWithUser,
    @Body() body: { refreshToken: string },
  ) {
    const userId = req.user.userId;
    const { refreshToken } = body;

    console.log(`Attempting to log out user ${userId}`);

    if (!refreshToken) {
      throw new BadRequestException('No refresh token provided for logout.');
    }

    try {
      await this.authService.revokeRefreshToken(refreshToken);
      console.log(`User ${userId} logged out successfully`);
      return { message: 'Logged out successfully.' };
    } catch (error) {
      console.error(`Error during logout for user ${userId}:`, error);
      throw new InternalServerErrorException('An error occurred during logout');
    }
  }

  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({ schema: { example: { refreshToken: 'string' } } })
  @Post('refresh')
  async refresh(@Body() body: { refreshToken: string }) {
    console.log('Refresh token request received:', body.refreshToken);

    try {
      const { accessToken, refreshToken } =
        await this.authService.refreshAccessToken(body.refreshToken);
      console.log('New tokens generated:', { accessToken, refreshToken });

      return {
        access_token: accessToken,
        refresh_token: refreshToken,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw new UnauthorizedException(error.message);
      }
      throw new InternalServerErrorException(
        'An error occurred while refreshing the token',
      );
    }
  }
}
