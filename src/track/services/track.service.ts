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

  async saveUploadedTrack(file: Express.Multer.File, trackMetadata: CreateTrackDto): Promise<{ filePath: string }> {
    // Define the upload path
    const uploadPath = process.env.UPLOAD_PATH || 'uploads';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
  
    const filename = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(uploadPath, filename);
  
    // Attempt to save the file to the filesystem
    try {
      // Save the file buffer to the specified path
      await fs.promises.writeFile(filePath, file.buffer);
  
      let durationInSeconds: number | null = null;
      let name = trackMetadata.name || 'Unnamed Track'; // Default name if not provided
  
      // Attempt to extract metadata from the file buffer
      try {
        const metadata = await musicMetadata.parseBuffer(file.buffer, file.mimetype || 'audio/mpeg');
        durationInSeconds = metadata.format.duration ? parseInt(metadata.format.duration.toString(), 10) : null;
        name = name || metadata.common.title || 'Unnamed Track';
      } catch (error) {
        console.error('Error extracting metadata:', error);
        durationInSeconds = trackMetadata.duration ? parseInt(trackMetadata.duration, 10) : null;
      }
  
      const validAlbumId = trackMetadata.albumId ? parseInt(trackMetadata.albumId, 10) : null;
  
      const trackData = {
        name: name,
        duration: durationInSeconds || 0,
        albumId: validAlbumId,
        filePath: filePath
      };
  
      // Save track data to the database
      await this.prisma.track.create({ data: trackData });
      console.log('Track data being saved:', trackData);
  
      return { filePath };
    } catch (error) {
      console.error('Error saving uploaded track:', error);
      throw new HttpException('Failed to save uploaded track', HttpStatus.INTERNAL_SERVER_ERROR);
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
