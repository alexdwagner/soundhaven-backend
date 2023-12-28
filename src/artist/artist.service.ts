// src/artist/artist.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArtistDto } from './dto/create-artist.dto';
import { UpdateArtistDto } from './dto/update-artist.dto';
import { Artist } from '@prisma/client';

@Injectable()
export class ArtistService {
  constructor(private prisma: PrismaService) {}

  async createArtist(createArtistDto: CreateArtistDto): Promise<Artist> {
    return this.prisma.artist.create({
      data: createArtistDto,
    });
  }

  async findAllArtists(): Promise<Artist[]> {
    return this.prisma.artist.findMany();
  }

  async updateArtist(
    id: string,
    updateArtistDto: UpdateArtistDto,
  ): Promise<Artist> {
    return this.prisma.artist.update({
      where: { id: Number(id) },
      data: updateArtistDto,
    });
  }

  // Additional methods like deleteArtist, findArtistById, etc., can be added as needed.
}
