import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateMarkerDto {
  @IsNumber()
  @IsNotEmpty()
  time: number;

  @IsNumber()
  @IsNotEmpty()
  trackId: number;

  @IsNumber()
  @IsNotEmpty()
  commentId: number;

  @IsString()
  @IsNotEmpty()
  waveSurferRegionID: string;
}
