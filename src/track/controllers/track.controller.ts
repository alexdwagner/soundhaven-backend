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
} from '@nestjs/common';
import { TrackService } from '../services/track.service';
import { CreateTrackDto } from '../dto/create-track.dto';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('tracks')
export class TrackController {
  constructor(private readonly trackService: TrackService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async createTrack(@Body() createTrackDto: CreateTrackDto) {
    return this.trackService.createTrack(createTrackDto);
  }

  @Get(':id')
  async getTrackById(@Param('id') id: string) {
    return this.trackService.getTrackById(id);
  }

  @Post('upload')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('file'))
  async uploadTrack(
    @UploadedFile() file: Express.Multer.File,
    @Body() trackMetadata: CreateTrackDto,
  ) {
    // The file and metadata are sent separately to the service method.
    return this.trackService.saveUploadedTrack(file, trackMetadata);
  }
}
