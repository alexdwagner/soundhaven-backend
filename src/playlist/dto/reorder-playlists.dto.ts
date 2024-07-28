import { IsArray, IsNumber } from 'class-validator';

export class ReorderPlaylistsDto {
  @IsArray()
  @IsNumber({}, { each: true })
  playlistIds: number[];
}
