// src/playlist/playlist.controller.ts

import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { PlaylistService } from './playlist.service';
import { CreatePlaylistDto } from './dto/create-playlist.dto';

@Controller('playlists')
export class PlaylistController {
  constructor(private readonly playlistService: PlaylistService) {}

  @Post()
  async createPlaylist(@Body() createPlaylistDto: CreatePlaylistDto) {
    return this.playlistService.createPlaylist(createPlaylistDto);
  }

  @Get(':id')
  async getPlaylistById(@Param('id') id: string) {
    return this.playlistService.getPlaylistById(id);
  }

  // Add other endpoints as needed
}
