// src/track/dto/create-track.dto.ts

import { IsString, IsOptional, IsArray, IsNumber } from 'class-validator';

export class CreateTrackDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  duration?: string; // Accept duration as a string

  @IsString()
  @IsOptional()
  albumId?: string; // Accept albumId as a string

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  genres?: number[]; // Array of genre IDs

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  playlists?: number[]; // Array of playlist IDs

  @IsString()
  @IsOptional()
  artistId?: string; // Accept artistId as a string

  @IsString()
  @IsOptional()
  filePath?: string; // Accept filePath as a string
}
