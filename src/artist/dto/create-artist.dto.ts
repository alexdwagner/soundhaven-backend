// src/artist/dto/create-artist.dto.ts

import { IsString, IsOptional } from 'class-validator';

export class CreateArtistDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  bio?: string;
}
