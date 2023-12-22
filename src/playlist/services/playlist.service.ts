// src/playlist/playlist.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePlaylistDto } from '../dto/create-playlist.dto';

@Injectable()
export class PlaylistService {
  constructor(private prisma: PrismaService) {}

  async createPlaylist(createPlaylistDto: CreatePlaylistDto) {
    return this.prisma.playlist.create({
      data: createPlaylistDto,
    });
  }

  async getPlaylistById(id: string) {
    return this.prisma.playlist.findUnique({
      where: { id: Number(id) },
    });
  }

  // Add other methods as needed
}
