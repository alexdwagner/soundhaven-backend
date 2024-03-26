import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './services/auth.service';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserModule } from 'src/user/user.module';
import { AuthController } from './controllers/auth.controller';
import { AuthMiddleware } from './middleware/auth.middleware';

@Module({
  imports: [
    UserModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.ACCESS_TOKEN_SECRET, // Use ACCESS_TOKEN_SECRET for JWT signing
      signOptions: { expiresIn: '60m' }, // Set a shorter expiration for access tokens
    }),
  ],
  providers: [AuthService, JwtStrategy, PrismaService],
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(
      { path: '/comments', method: RequestMethod.POST }, // For adding a new comment
      { path: '/comments/with-marker', method: RequestMethod.POST }, // For adding a new comment with a marker
    );
  }
}
