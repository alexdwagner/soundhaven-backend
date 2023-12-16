// src/album/album.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAlbumDto } from './dto/create-album.dto';

@Injectable()
export class AlbumService {
  constructor(private prisma: PrismaService) {}

  async createAlbum(createAlbumDto: CreateAlbumDto) {
    return this.prisma.album.create({
      data: createAlbumDto,
    });
  }

  async getAlbumById(id: string) {
    return this.prisma.album.findUnique({
      where: { id: Number(id) },
    });
  }

  // Add other methods as needed
}
