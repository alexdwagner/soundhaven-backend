// src/prisma/prisma.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    super({
      datasources: { db: { url: process.env.DATABASE_URL } },
    });
  }

  // User Model Methods
  async createUser(data: { email: string; password: string; name?: string }) {
    const hashedPassword = await hash(data.password, 10); // Hashing password
    return this.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
      },
    });
  }

  async findUserByEmail(email: string) {
    return this.user.findUnique({
      where: { email },
    });
  }

  // Artist Model Methods
  async addArtist(data: { name: string; bio?: string }) {
    return this.artist.create({
      data,
    });
  }

  async getAllArtists() {
    return this.artist.findMany();
  }

  // Album Model Methods
  async createAlbum(data: {
    title: string;
    releaseDate: Date;
    artistId: number;
  }) {
    return this.album.create({
      data,
    });
  }

  async getAlbumsByArtist(artistId: number) {
    return this.album.findMany({
      where: { artistId },
    });
  }

  // Playlist Model Methods
  async createPlaylistForUser(
    userId: number,
    data: { title: string; description?: string },
  ) {
    return this.playlist.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  async getPlaylistsByUser(userId: number) {
    return this.playlist.findMany({
      where: { userId },
    });
  }

  // Seed database with initial data
  async seedDatabase() {
    const genreData = [
      { name: 'Rock' },
      { name: 'Jazz' } /* ... more genres ... */,
    ];
    const artistData = [
      {
        name: 'Artist One',
        bio: 'Bio of Artist One',
      } /* ... more artists ... */,
    ];

    await this.$transaction(async (prisma) => {
      for (const genre of genreData) {
        await prisma.genre.create({ data: genre });
      }

      for (const artist of artistData) {
        await prisma.artist.create({ data: artist });
      }
    });
  }
}
