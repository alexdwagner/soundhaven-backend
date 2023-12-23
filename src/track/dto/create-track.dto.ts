// src/track/dto/create-track.dto.ts

import { IsString, IsInt, IsOptional } from 'class-validator';

export class CreateTrackDto {
  @IsString()
  title: string;

  @IsInt()
  @IsOptional()
  duration?: number; // Make duration optional

  @IsInt()
  @IsOptional()
  albumId?: number;

  // File is not validated here as it's handled by Multer, but included for structure
  file?: Express.Multer.File;
}
