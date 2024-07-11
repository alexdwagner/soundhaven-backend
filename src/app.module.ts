import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { TrackModule } from './track/track.module';
import { PlaylistModule } from './playlist/playlist.module';
import { AuthModule } from './auth/auth.module';
import { ArtistModule } from './artist/artist.module';
import { AlbumModule } from './album/album.module';
import { CommentsModule } from './comments/comments.module';
import { MarkersModule } from './markers/markers.module';
import { ConfigModule } from './config/config.module';

@Module({
  imports: [
    ConfigModule,
    TrackModule,
    PlaylistModule,
    AuthModule,
    ArtistModule,
    AlbumModule,
    CommentsModule,
    MarkersModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
