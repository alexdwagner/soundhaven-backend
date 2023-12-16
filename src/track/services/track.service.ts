// src/track/track.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTrackDto } from './../dto/create-track.dto';

@Injectable()
export class TrackService {
  constructor(private prisma: PrismaService) {}

  async createTrack(createTrackDto: CreateTrackDto) {
    return this.prisma.track.create({
      data: createTrackDto,
    });
  }

  async getTrackById(id: string) {
    return this.prisma.track.findUnique({
      where: { id: Number(id) },
    });
  }

  // Add other methods as needed
}
