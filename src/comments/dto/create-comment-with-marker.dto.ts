import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateCommentWithMarkerDto {
  @IsNotEmpty()
  content: string;

  @IsNumber()
  trackId: number;

  @IsNumber()
  time: number; // Assuming this is the marker time

  @IsNotEmpty()
  waveSurferRegionID: string;
}
