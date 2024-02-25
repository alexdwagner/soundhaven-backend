// src/track/track.service.ts

import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTrackDto } from './../dto/create-track.dto';
import { UpdateTrackDto } from '../dto/update-track.dto';
import * as fs from 'fs/promises'; // Directly import fs/promises
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

  async getTrackById(id: string) {
    return this.prisma.track.findUnique({
      where: { id: Number(id) },
    });
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

  async saveUploadedTrack(
    file: Express.Multer.File,
    trackMetadata: CreateTrackDto,
  ): Promise<{ filePath: string }> {
    const uploadPath = process.env.UPLOAD_PATH || 'uploads';
    // Ensure the directory exists
    try {
      await fs.mkdir(uploadPath, { recursive: true });
    } catch (error) {
      console.error('Could not create upload directory:', error);
    }

    const filename = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(uploadPath, filename);

    // Save the file
    try {
      await fs.writeFile(filePath, file.buffer);
      console.log('File saved to:', filePath);

      // Additional code to handle file metadata and save track info to DB...
      let durationInSeconds: number | null = null;
      let name = trackMetadata.name || 'Unnamed Track';

      // Try to extract duration from metadata
      try {
        const metadata = await musicMetadata.parseBuffer(file.buffer, file.mimetype || 'audio/mpeg');
        durationInSeconds = metadata.format.duration ? parseInt(metadata.format.duration.toString(), 10) : null;
        name = name || metadata.common.title || 'Unnamed Track';
      } catch (error) {
        console.error('Error extracting metadata:', error);
      }

      const trackData = {
        name,
        duration: durationInSeconds || 0,
        filePath,
        // other properties
      };

      // Save track data to DB
      const savedTrack = await this.prisma.track.create({ data: trackData });
      console.log('Track saved:', savedTrack);

      return { filePath };
    } catch (error) {
      console.error('Error saving file:', error);
      throw new HttpException('Failed to save file', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteTrack(id: string) {
    console.log(`Attempting to delete track with ID: ${id}`);
    const trackIdNumber = Number(id);

    // Check if the track exists
    const track = await this.prisma.track.findUnique({
      where: { id: trackIdNumber },
    });

    if (!track) {
      console.log(`Track with ID ${id} not found.`);
      throw new HttpException('Track not found', HttpStatus.NOT_FOUND);
    }

    // Delete related records in TracksInPlaylist and TracksInGenre
    await this.prisma.tracksInPlaylist.deleteMany({
      where: { trackId: trackIdNumber },
    });
    await this.prisma.tracksInGenre.deleteMany({
      where: { trackId: trackIdNumber },
    });

    try {
      await this.prisma.track.delete({
        where: { id: trackIdNumber },
      });
      console.log(`Track with ID ${id} deleted successfully.`);
      return { message: 'Track deleted successfully' };
    } catch (error) {
      console.error(
        `Error occurred while deleting track with ID ${id}:`,
        error,
      );
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
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
