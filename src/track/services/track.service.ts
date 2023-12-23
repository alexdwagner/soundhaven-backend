// src/track/track.service.ts

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTrackDto } from './../dto/create-track.dto';
import * as fs from 'fs';
import * as path from 'path';
import { Express } from 'express';

@Injectable()
export class TrackService {
  constructor(private prisma: PrismaService) {}

  async createTrack(createTrackDto: CreateTrackDto) {
    const trackData = {
      title: createTrackDto.title,
      duration: createTrackDto.duration,
      album: createTrackDto.albumId
        ? { connect: { id: createTrackDto.albumId } }
        : undefined,
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
  ) {
    // Define the upload path
    const uploadPath = process.env.UPLOAD_PATH || 'uploads';

    // Ensure the upload directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    // Generate a unique filename for the uploaded file
    const filename = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(uploadPath, filename);

    // Save the file to the filesystem
    fs.writeFileSync(filePath, file.buffer);

    // Construct trackData for Prisma
    const trackData = {
      title: trackMetadata.title,
      duration: trackMetadata.duration,
      ...(trackMetadata.albumId && {
        album: { connect: { id: trackMetadata.albumId } },
      }),
      filePath: filePath, // Storing the path to the file
      // Note: Exclude relations and auto-handled fields
    };

    // Create and save the track record in the database
    return this.prisma.track.create({
      data: trackData,
    });
  }
}
