// src/album/album.controller.ts

import { Controller, Post, Body, Get, Patch, Param } from '@nestjs/common';
import { CreateAlbumDto } from './dto/create-album.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';
import { AlbumService } from './album.service';
import { ApiResponse } from '@nestjs/swagger';

@Controller('albums')
export class AlbumController {
  constructor(private readonly albumService: AlbumService) {}

  @Get()
  @ApiResponse({ status: 200, description: 'All albums retrieved.' })
  @ApiResponse({ status: 404, description: 'No albums found.' })
  async getAllAlbums() {
    return this.albumService.getAllAlbums();
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Album found.' })
  @ApiResponse({ status: 404, description: 'Album not found.' })
  async getAlbumById(@Param('id') id: string) {
    return this.albumService.getAlbumById(id);
  }

  @Post()
  @ApiResponse({ status: 201, description: 'Album successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async createAlbum(@Body() createAlbumDto: CreateAlbumDto) {
    return this.albumService.createAlbum(createAlbumDto);
  }

  @Patch(':id')
  async updateAlbum(
    @Param('id') id: string,
    @Body() updateAlbumDto: UpdateAlbumDto,
  ) {
    return this.albumService.updateAlbum(id, updateAlbumDto);
  }
}
