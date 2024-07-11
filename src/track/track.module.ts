import { Module } from '@nestjs/common';
import { TrackController } from './controllers/track.controller';
import { TrackService } from './services/track.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from '../config/config.service';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [TrackController],
  providers: [TrackService, ConfigService],
})
export class TrackModule {}
