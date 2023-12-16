// src/track/dto/create-track.dto.ts

import { IsString, IsInt, IsOptional } from 'class-validator';

export class CreateTrackDto {
  @IsString()
  title: string;

  @IsInt()
  duration: number;

  @IsInt()
  @IsOptional()
  albumId?: number;
}
