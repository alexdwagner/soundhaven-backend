// src/artist/artist.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ArtistService {
  constructor(private prisma: PrismaService) {}

  async addArtist(data: { name: string; bio?: string }) {
    return this.prisma.addArtist(data);
  }

  async getAllArtists() {
    return this.prisma.getAllArtists();
  }
}
