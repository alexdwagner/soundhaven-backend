import { IsOptional, IsString } from 'class-validator';

export class UpdatePlaylistMetadataDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}