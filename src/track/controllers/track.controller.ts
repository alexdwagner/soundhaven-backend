// src/track/track.controller.ts

import { Controller, Post, UseGuards, Get, Patch, Delete, Param, Body } from '@nestjs/common';
import { TrackService } from './track.service';
import { CreateTrackDto } from './dto/create-track.dto';
import { AuthGuard } from '@nestjs/passport';

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

  // Add other endpoints as needed
}
