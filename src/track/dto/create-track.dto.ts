// src/track/dto/create-track.dto.ts

import { IsString, IsOptional } from 'class-validator';

export class CreateTrackDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  duration?: string; // Accept duration as a string

  @IsString()
  @IsOptional()
  albumId?: string; // Accept albumId as a string
}
