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
import { UpdateTrackDto } from '../dto/update-track.dto';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('tracks')
export class TrackController {
  constructor(private readonly trackService: TrackService) { }

  // @UseGuards(AuthGuard('jwt'))
  @Post()
  async createTrack(@Body() createTrackDto: CreateTrackDto) {
    return this.trackService.createTrack(createTrackDto);
  }

  @Get(':id')
  async getTrackById(@Param('id') id: string) {
    return this.trackService.getTrackById(id);
  }

  @Get()
  async getAllTracks() {
    try {
      return this.trackService.getAllTracks();
    } catch (error) {
      console.error('Error fetching tracks:', error);
      throw new HttpException('Failed to fetch tracks', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('upload')
  // @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('file'))
  async uploadTrack(
    @UploadedFile() file: Express.Multer.File,
    @Body() trackMetadata: CreateTrackDto,
  ) {
    console.log('Upload request received with file:', file?.originalname);
    const { filePath } = await this.trackService.saveUploadedTrack(
      file,
      trackMetadata,
    );
    return { message: 'File uploaded successfully', filePath };
  }


  @Delete(':id')
  async deleteTrack(@Param('id') id: string) {
    return this.trackService.deleteTrack(id);
  }

  @Patch(':id')
  async updateTrack(@Param('id') id: string, @Body() updateTrackDto: UpdateTrackDto) {
    return this.trackService.updateTrack(id, updateTrackDto);
}
}

