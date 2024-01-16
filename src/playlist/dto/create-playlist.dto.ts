// src/playlist/dto/create-playlist.dto.ts

import { IsString, IsInt, IsOptional } from 'class-validator';

export class CreatePlaylistDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  userId: number;
}
