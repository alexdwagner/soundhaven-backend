import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateCommentWithMarkerDto {
  @IsNotEmpty()
  content: string;

  @IsNumber()
  trackId: number;

  @IsNumber()
  time: number;

  @IsNumber()
  duration: number;

  @IsNotEmpty()
  waveSurferRegionID: string;
}
