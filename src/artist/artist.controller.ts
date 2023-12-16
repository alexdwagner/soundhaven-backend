// src/artist/artist.controller.ts

import { Controller, Post, Body, Get } from '@nestjs/common';
import { ArtistService } from './artist.service';
import { CreateArtistDto } from './dto/create-artist.dto';

@Controller('artists')
export class ArtistController {
  constructor(private readonly artistService: ArtistService) {}

  @Post()
  async addArtist(@Body() createArtistDto: CreateArtistDto) {
    return this.artistService.addArtist(createArtistDto);
  }

  @Get()
  async getAllArtists() {
    return this.artistService.getAllArtists();
  }
}
