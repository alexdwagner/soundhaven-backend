import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateMarkerDto {
  @IsNumber()
  @IsNotEmpty()
  start: number;

  @IsNumber()
  @IsNotEmpty()
  trackId: number;

  @IsNumber()
  @IsNotEmpty()
  commentId: number;
}
