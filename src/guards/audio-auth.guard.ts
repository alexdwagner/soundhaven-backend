import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class AudioAuthGuard extends AuthGuard('jwt') implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const path = request.path;

    // Allow access to uploads only for authenticated users
    if (path.startsWith('/uploads/')) {
      return super.canActivate(context);
    }

    // For other routes, allow access (they will be handled by their own guards)
    return true;
  }
}