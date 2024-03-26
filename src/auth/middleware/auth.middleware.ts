// auth.middleware.ts
import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthenticatedRequest } from '@/types/request';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private authService: AuthService) {}

  async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    console.log('AuthMiddleware - entered middleware'); // Add this logging

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('Authorization header is missing');
    }

    const token = authHeader.split(' ')[1];
    console.log('AuthMiddleware - extracted token:', token);

    try {
      const validationResult = await this.authService.validateToken(token);
      if (!validationResult.isValid) {
        // Handle invalid token appropriately, but don't send a response directly
        throw new UnauthorizedException('Invalid token');
      }

      // Attach user details to the request object
      req.user = {
        id: validationResult.user.id,
        email: validationResult.user.email,
        name: validationResult.user.name,
      };

      next(); // Allow NestJS to handle the response
    } catch (error) {
      console.log('AuthMiddleware - error:', error);
      // Let NestJS handle the error response (explained below)
      throw error;
    }
  }
  // Helper function
  private getUserIdFromRequest(req: AuthenticatedRequest): number {
    if (!req.user) {
      throw new Error('User information missing from request'); // Or handle appropriately
    }
    return parseInt(req.user.id, 10);
  }
}
