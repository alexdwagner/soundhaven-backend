import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsDate, IsNumber } from 'class-validator';

export class CreateAlbumDto {
  @ApiProperty({ description: 'Title of the album' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Release date of the album',
    example: '2023-01-01',
  })
  @IsNotEmpty()
  @IsDate()
  releaseDate: Date;

  @ApiProperty({
    description: 'ID of the artist associated with the album',
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  artistId: number;
}
