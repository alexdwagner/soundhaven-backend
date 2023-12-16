// src/album/album.controller.ts

import { Controller, Post, Body, Get, Param, Response } from '@nestjs/common';
import { CreateAlbumDto } from './dto/create-album.dto';
import { AlbumService } from './album.service';
import

@Controller('albums')
export class AlbumController {
  constructor(private readonly albumService: AlbumService) {}

  @Post()
  @ApiResponse({ status: 201, description: 'Album successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async createAlbum(@Body() createAlbumDto: CreateAlbumDto) {
    return this.albumService.createAlbum(createAlbumDto);
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Album found.' })
  @ApiResponse({ status: 404, description: 'Album not found.' })
  async getAlbumById(@Param('id') id: string) {
    return this.albumService.getAlbumById(id);
  }

  // Add other endpoints as needed
}
