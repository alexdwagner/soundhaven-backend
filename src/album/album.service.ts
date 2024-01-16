// src/album/album.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAlbumDto } from './dto/create-album.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';
import { ApiResponse } from '@nestjs/swagger';

@Injectable()
export class AlbumService {
  constructor(private prisma: PrismaService) {}

  async getAllAlbums() {
    return this.prisma.album.findMany();
  }

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

  async updateAlbum(id: string, updateAlbumDto: UpdateAlbumDto) {
    return this.prisma.album.update({
      where: { id: Number(id) },
      data: updateAlbumDto,
    });
  }
}
