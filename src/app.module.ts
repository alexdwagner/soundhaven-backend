import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { TrackModule } from './track/track.module';
import { PlaylistService } from './playlist/services/playlist.service';
import { PlaylistController } from './playlist/controllers/playlist.controller';
import { PlaylistModule } from './playlist/playlist.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [TrackModule, PlaylistModule, AuthModule],
  controllers: [AppController, PlaylistController],
  providers: [AppService, PrismaService, PlaylistService],
})
export class AppModule {}
