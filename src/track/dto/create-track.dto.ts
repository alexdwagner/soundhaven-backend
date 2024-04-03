// src/track/dto/create-track.dto.ts

import { IsString, IsNotEmpty } from 'class-validator';

export class CreateTrackDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
