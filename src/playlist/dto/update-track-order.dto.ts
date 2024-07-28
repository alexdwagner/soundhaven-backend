import { IsArray, IsNumber } from 'class-validator';

export class UpdateTrackOrderDto {
  @IsArray()
  @IsNumber({}, { each: true })
  trackIds: number[];
}