import { Module } from '@nestjs/common';
import { MarkersService } from './markers.service';
import { MarkersController } from './markers.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [MarkersController],
  providers: [MarkersService, PrismaService],
})
export class MarkersModule {}
