import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    console.log('JwtAuthGuard: Checking authentication');
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any): any {
    console.log('JwtAuthGuard: Handling request');
    console.log('Error:', err);
    console.log('User:', user);
    console.log('Info:', info);

    if (err || !user) {
      console.log('JwtAuthGuard: Authentication failed');
      throw err || new Error('Authentication failed');
    }
    
    console.log('JwtAuthGuard: Authentication successful');
    return user;
  }
}