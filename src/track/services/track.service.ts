// src/track/track.service.ts

import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Prisma, Artist, Album } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTrackDto } from './../dto/create-track.dto';
import { UpdateTrackMetadataDto } from '../dto/update-track-metadata.dto';
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
    return this.prisma.track.findMany({
      include: {
        artist: true,
        album: true,
      },
    });
  }

  async getTrackById(id: string) {
    return this.prisma.track.findUnique({
      where: { id: Number(id) },
    });
  }

  async saveUploadedTrack(
    file: Express.Multer.File,
    name: string,
  ): Promise<{ filePath: string }> {
    const uploadPath = process.env.UPLOAD_PATH || 'uploads';

    // Ensure the directory exists
    await fs.mkdir(uploadPath, { recursive: true }).catch((error) => {
      console.error('Could not create upload directory:', error);
      throw new HttpException(
        'Failed to create upload directory',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    });

    const filename = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(uploadPath, filename);

    try {
      // Save the file
      await fs.writeFile(filePath, file.buffer);
      console.log('File saved to:', filePath);

      // Extract metadata for duration, artist, and album
      const metadata = await musicMetadata.parseBuffer(
        file.buffer,
        file.mimetype,
      );
      const durationInSeconds = metadata.format.duration ?? 0;
      const artistName = metadata.common.artist || 'Unknown Artist';
      const albumName = metadata.common.album || 'Unknown Album';

      console.log('Extracted metadata:');
      console.log('Duration:', durationInSeconds);
      console.log('Artist:', artistName);
      console.log('Album:', albumName);

      // Use helper functions to find or create artist and album based on extracted names
      const artist = await this.findOrCreateArtist(artistName);
      const album = await this.findOrCreateAlbum(albumName, artist?.id);

      console.log('Found or created artist:', artist);
      console.log('Found or created album:', album);

      // Construct trackData with extracted metadata
      const trackData: Prisma.TrackCreateInput = {
        name: file.originalname, // Consider sanitizing or formatting
        duration: durationInSeconds,
        filePath: `${uploadPath}/${filename}`, // Ensure filePath is correctly formed
        artist: artist ? { connect: { id: artist.id } } : undefined,
        album: album ? { connect: { id: album.id } } : undefined,
        // Handle genres and playlists if applicable
      };

      console.log('Track data to be saved:', trackData);

      const savedTrack = await this.prisma.track.create({ data: trackData });
      console.log('Track saved:', savedTrack);

      return { filePath };
    } catch (error) {
      console.error('Error saving file:', error);
      throw new HttpException(
        'Failed to save file',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Helper method to reduce repetition for finding or creating artist/album
  private async findOrCreateArtist(
    artistName?: string,
  ): Promise<Artist | null> {
    if (!artistName) return null;
    let artist = await this.prisma.artist.findFirst({
      where: { name: artistName },
    });
    if (!artist) {
      artist = await this.prisma.artist.create({
        data: { name: artistName },
      });
    }
    return artist;
  }

  private async findOrCreateAlbum(
    albumName?: string,
    artistId?: number,
  ): Promise<Album | null> {
    if (!albumName || !artistId) return null;
    let album = await this.prisma.album.findFirst({
      where: { name: albumName, artistId },
    });
    if (!album) {
      album = await this.prisma.album.create({
        data: {
          name: albumName,
          releaseDate: new Date(),
          artist: { connect: { id: artistId } },
        },
      });
    }
    return album;
  }

  // Helper method for connecting genres and playlists
  private connectIds(
    ids?: number[],
  ): { connect?: { id: number }[] } | undefined {
    return ids && ids.length > 0
      ? {
          connect: ids.map((id) => ({ id })),
        }
      : undefined;
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

  async updateTrackMetadata(
    id: string,
    updateTrackMetadataDto: UpdateTrackMetadataDto,
  ) {
    console.log(`Starting update for track ID: ${id}`, updateTrackMetadataDto);

    try {
      const updateData: Prisma.TrackUpdateInput = {
        name: updateTrackMetadataDto.name,
      };

      console.log('Initial update data:', updateData);

      let artist: Artist | null = null;
      if (updateTrackMetadataDto.artistName) {
        console.log(
          `Finding artist by name: ${updateTrackMetadataDto.artistName}`,
        );

        artist = await this.prisma.artist.findFirst({
          where: { name: updateTrackMetadataDto.artistName },
        });

        if (!artist) {
          console.log(
            `Creating new artist with name: ${updateTrackMetadataDto.artistName}`,
          );

          artist = await this.prisma.artist.create({
            data: { name: updateTrackMetadataDto.artistName },
          });
        }

        console.log(`Artist found or created: ${artist.id}`);
        updateData.artist = { connect: { id: artist.id } };
      }

      if (updateTrackMetadataDto.albumName) {
        console.log(
          `Finding or creating album with name: ${updateTrackMetadataDto.albumName} for artist ID: ${artist?.id}`,
        );

        // Only include artistId if it's actually available
        const albumCreateData: any = {
          name: updateTrackMetadataDto.albumName,
          releaseDate: new Date(),
        };

        if (artist) {
          albumCreateData.artistId = artist.id;
        }

        let album = await this.prisma.album.findFirst({
          where: {
            name: updateTrackMetadataDto.albumName,
            ...(artist && { artistId: artist.id }), // Ensure artistId is only included if not undefined
          },
        });

        if (!album) {
          console.log(
            `Creating new album with name: ${updateTrackMetadataDto.albumName}`,
          );

          album = await this.prisma.album.create({
            data: albumCreateData,
          });
        }

        console.log(`Album found or created: ${album.id}`);
        updateData.album = { connect: { id: album.id } };
      }

      console.log('Final update data:', updateData);

      const updatedTrack = await this.prisma.track.update({
        where: { id: Number(id) },
        data: updateData,
        include: {
          artist: true,
          album: true,
        },
      });

      console.log(`Track updated successfully: ${updatedTrack.id}`);
      return updatedTrack;
    } catch (error) {
      console.error('Error updating track metadata:', error);
      throw new HttpException(
        'Failed to update track metadata',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
