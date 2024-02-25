import { IsNotEmpty, IsNumber } from 'class-validator';

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
}
