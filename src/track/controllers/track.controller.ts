// src/track/track.controller.ts

import {
  Controller,
  Post,
  UseGuards,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  Req,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { TrackService } from '../services/track.service';
import { CreateTrackDto } from '../dto/create-track.dto';
import { UpdateTrackMetadataDto } from '../dto/update-track-metadata.dto';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { GetUser } from 'src/decorators/get-user.decorator';
import { User } from '@prisma/client';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { Multer } from 'multer';

@Controller('tracks')
@UseGuards(JwtAuthGuard)
export class TrackController {
  constructor(private readonly trackService: TrackService) {}

  @Get(':id')
  async getTrackById(@Param('id') id: string, @GetUser() user: User) {
    return this.trackService.getTrackById(id, user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getAllTracks(@GetUser() user: User) {
    console.log('User ID from token:', user.id);
    // console.log('getAllTracks: Received request');
    // console.log('User from request:', req.user);

    try {
      const tracks = await this.trackService.getAllTracks(user.id);
      console.log(`Fetched ${tracks.length} tracks for user ${user.id}`);
      return tracks;
    } catch (error) {
      console.error('Error fetching tracks:', error);
      throw new HttpException(
        'Failed to fetch tracks',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadTrack(
    @UploadedFile() file: Express.Multer.File,
    @Body('name') name: string,
    @GetUser() user: User
  ): Promise<{ message: string; filePath?: string }> {
    try {
      console.log(`Upload request received with file: ${file?.originalname}`);
      const { filePath } = await this.trackService.saveUploadedTrack(
        file,
        name,
        user.id,
      );

      console.log(`File uploaded successfully: ${filePath}`);
      return { message: 'File uploaded successfully', filePath };
    } catch (error) {
      console.error(`Failed to upload file: ${error.message}`);
      throw new HttpException(
        'Failed to upload track',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  async deleteTrack(@Param('id') id: string, @GetUser() user: User) {
    console.log('Deleting track with ID:', id);
    return this.trackService.deleteTrack(id, user.id);
  }

  @Patch(':id')
  async updateTrackMetadata(
    @Param('id') id: string,
    @Body() updateTrackDto: UpdateTrackMetadataDto,
    @GetUser() user: User
  ) {
    console.log(`Received update for track ${id}:`, updateTrackDto);
    try {
      const allowedFields = ['name', 'artistName', 'albumName'];
      const invalidFields = Object.keys(updateTrackDto).filter(
        (field) => !allowedFields.includes(field),
      );
      if (invalidFields.length > 0) {
        throw new HttpException(
          `Invalid fields provided: ${invalidFields.join(', ')}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const updatedTrack = await this.trackService.updateTrackMetadata(
        id,
        updateTrackDto,
        user.id,
      );
      if (!updatedTrack) {
        throw new HttpException('Track not found', HttpStatus.NOT_FOUND);
      }
      return updatedTrack;
    } catch (error) {
      console.error('Error updating track metadata:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to update track metadata',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
