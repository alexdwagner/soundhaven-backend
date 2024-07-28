import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PlaylistService } from '../playlist/playlist.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private playlistService: PlaylistService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const playlistId =
      request.params.playlistId || request.params.id || request.body.id;

    if (!playlistId) {
      return false;
    }

    console.log(
      `PermissionsGuard: Checking access for user ${user.id} on playlist ${playlistId}`,
    );

    try {
      const hasAccess = await this.playlistService.checkUserPermission(
        user.id,
        Number(playlistId),
      );
      if (!hasAccess) {
        console.log(
          `Access denied for user ${user.id} on playlist ${playlistId}`,
        );
        throw new ForbiddenException('Forbidden resource');
      }

      console.log(
        `PermissionsGuard: Access granted for user ${user.id} on playlist ${playlistId}`,
      );
      return true;
    } catch (error) {
      console.error('PermissionsGuard: Error checking permissions:', error);
      return false;
    }
  }
}
