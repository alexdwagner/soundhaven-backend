import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { join } from 'path';

@Injectable()
export class ConfigService {
  constructor(private nestConfigService: NestConfigService) {}

  get<T>(key: string): T | undefined {
    return this.nestConfigService.get<T>(key);
  }

  getOrThrow<T>(key: string): T {
    const value = this.get<T>(key);
    if (value === undefined) {
      throw new Error(`Configuration key "${key}" is not defined`);
    }
    return value;
  }

  get uploadPath(): string {
    return this.get<string>('UPLOAD_PATH') || './uploads';
  }

  get fullUploadPath(): string {
    return join(process.cwd(), this.uploadPath);
  }

  get backendUrl(): string {
    return this.get<string>('BACKEND_URL') || 'http://localhost:3122';
  }

  get port(): number {
    return this.get<number>('PORT') || 3122;
  }

  get accessTokenSecret(): string {
    return this.getOrThrow<string>('ACCESS_TOKEN_SECRET');
  }

  get refreshTokenSecret(): string {
    return this.getOrThrow<string>('REFRESH_TOKEN_SECRET');
  }

  get jwtExpirationTime(): string {
    return this.get<string>('JWT_EXPIRATION_TIME') || '60m';
  }
}
