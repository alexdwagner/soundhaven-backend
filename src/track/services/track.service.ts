// src/track/track.service.ts

import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTrackDto } from './../dto/create-track.dto';
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
    // Parse duration and albumId to integers, or use null if parsing fails
    const duration = createTrackDto.duration
      ? parseInt(createTrackDto.duration, 10)
      : null;
    const albumId = createTrackDto.albumId
      ? parseInt(createTrackDto.albumId, 10)
      : null;

    const trackData = {
      title: createTrackDto.title,
      duration: !isNaN(duration) ? duration : null, // Use parsed value or null
      albumId: !isNaN(albumId) ? albumId : null, // Use parsed value or null
      // other fields
    };

    return this.prisma.track.create({
      data: trackData,
    });
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

    let durationInSeconds = null;
    let title = trackMetadata.title;

    try {
      const metadata = await musicMetadata.parseBuffer(file.buffer, file.mimetype);
      durationInSeconds = metadata.format.duration; // Extracted duration in seconds
      title = title || metadata.common.title; // Use provided title or extract from metadata
    } catch (error) {
      console.error('Error extracting metadata:', error);
      // Fallback to provided duration if metadata extraction fails
      durationInSeconds = parseInt(trackMetadata.duration, 10) || null;
    }

    // Ensure albumId is a number
    let validAlbumId = null;
    if (trackMetadata.albumId) {
      const parsedAlbumId = parseInt(trackMetadata.albumId, 10);
      if (!isNaN(parsedAlbumId)) {
        const album = await this.prisma.album.findUnique({
          where: { id: parsedAlbumId }
        });
        if (album) {
          validAlbumId = parsedAlbumId;
        }
      }
    }

    const trackData = {
      title: title,
      duration: durationInSeconds,
      albumId: validAlbumId,
      filePath: filePath,
    };

    try {
      await this.prisma.track.create({ data: trackData });
      return { filePath };
    } catch (error) {
      console.error('Error in saveUploadedTrack:', error);
      throw new HttpException('Failed to upload track', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
