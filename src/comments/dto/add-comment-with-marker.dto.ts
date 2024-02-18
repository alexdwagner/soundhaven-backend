import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class AddCommentWithMarkerDto {
  @IsNumber({}, { message: 'trackId must be a number' })
  trackId: number;

  @IsNumber({}, { message: 'userId must be a number' })
  userId: number;

  @IsString({ message: 'content must be a string' })
  @IsNotEmpty({ message: 'content should not be empty' })
  content: string;

  @IsNumber({}, { message: 'start must be a number' })
  @IsNotEmpty()
  start: number;

  @IsOptional()
  @IsNumber({}, { message: 'end must be a number' })
  end?: number;
}
