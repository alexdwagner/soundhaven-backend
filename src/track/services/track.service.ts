// src/track/track.service.ts

import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTrackDto } from './../dto/create-track.dto';
import { UpdateTrackDto } from '../dto/update-track.dto';
import * as fs from 'fs';
import * as path from 'path';
import { Express } from 'express';
import * as musicMetadata from 'music-metadata';

@Injectable()
export class TrackService {
  constructor(private prisma: PrismaService) {
    console.log('TrackService instantiated');
  }

  async getAllTracks() {
    console.log('Service: Fetching all tracks');
    return this.prisma.track.findMany();
  }

  async createTrack(createTrackDto: CreateTrackDto) {
    // Check if properties are defined and parse them to integers, or provide default values
    const duration =
      createTrackDto.duration !== undefined
        ? parseInt(createTrackDto.duration, 10)
        : 0;
    const albumId =
      createTrackDto.albumId !== undefined
        ? parseInt(createTrackDto.albumId, 10)
        : null;
    const artistId =
      createTrackDto.artistId !== undefined
        ? parseInt(createTrackDto.artistId, 10)
        : null;

    const trackData: Prisma.TrackCreateInput = {
      name: createTrackDto.name || 'Unnamed Track',
      duration, // Handled to be number or default 0
      artist: artistId ? { connect: { id: artistId } } : undefined,
      album: albumId ? { connect: { id: albumId } } : undefined,
      filePath: createTrackDto.filePath,
      genres:
        createTrackDto.genres && createTrackDto.genres.length > 0
          ? {
              connect: createTrackDto.genres.map((genreId) => ({
                id: genreId,
              })),
            }
          : undefined,

      playlists:
        createTrackDto.playlists && createTrackDto.playlists.length > 0
          ? {
              connect: createTrackDto.playlists.map((playlistId) => ({
                id: playlistId,
              })),
            }
          : undefined,
    };

    return this.prisma.track.create({ data: trackData });
  }

  async getTrackById(id: string) {
    return this.prisma.track.findUnique({
      where: { id: Number(id) },
    });
  }

  async saveUploadedTrack(
    file: Express.Multer.File,
    trackMetadata: CreateTrackDto,
  ): Promise<{ filePath: string }> {
    // Define the upload path
    const uploadPath = process.env.UPLOAD_PATH || 'uploads';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    const filename = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(uploadPath, filename);
    fs.writeFileSync(filePath, file.buffer);

    let durationInSeconds: number | null = null;
    let name = trackMetadata.name || 'Unnamed Track'; // Default name if not provided

    try {
      const metadata = await musicMetadata.parseBuffer(
        file.buffer,
        file.mimetype || 'audio/mpeg', // Default mimetype if undefined
      );
      durationInSeconds = metadata.format.duration
        ? parseInt(metadata.format.duration.toString(), 10)
        : null; // Default to null if undefined
      name = name || metadata.common.title || 'Unnamed Track'; // Default name if not provided
    } catch (error) {
      console.error('Error extracting metadata:', error);
      durationInSeconds = trackMetadata.duration
        ? parseInt(trackMetadata.duration, 10)
        : null; // Default to null if undefined
    }

    const validAlbumId = trackMetadata.albumId
      ? parseInt(trackMetadata.albumId, 10)
      : null; // Default to null if undefined

    const trackData = {
      name: name,
      duration: durationInSeconds || 0, // Default to 0 if null
      albumId: validAlbumId,
      filePath: filePath || '', // Default to an empty string if filePath is undefined
      // ... other fields as needed
    };

    try {
      await this.prisma.track.create({ data: trackData });
      return { filePath };
    } catch (error) {
      console.error('Error in saveUploadedTrack:', error);
      throw new HttpException(
        'Failed to upload track',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteTrack(id: string) {
    await this.prisma.track.delete({
      where: {
        id: Number(id),
      },
    });

    return { message: 'Track deleted successfully' };
  }

  async updateTrack(id: string, updateTrackDto: UpdateTrackDto) {
    try {
      const updateData: Prisma.TrackUpdateInput = {
        name: updateTrackDto.name,
        // Dynamically include fields only if they are provided
        ...(updateTrackDto.artistId && {
          artist: { connect: { id: Number(updateTrackDto.artistId) } },
        }),
        ...(updateTrackDto.albumId && {
          album: { connect: { id: Number(updateTrackDto.albumId) } },
        }),
      };

      return await this.prisma.track.update({
        where: { id: Number(id) },
        data: updateData,
      });
    } catch (error) {
      console.error('Error updating track:', error);
      throw new HttpException(
        'Failed to update track',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
