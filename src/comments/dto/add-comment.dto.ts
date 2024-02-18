import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class AddCommentDto {
  @IsNumber({}, { message: 'trackId must be a number' })
  trackId: number;

  @IsNumber({}, { message: 'userId must be a number' })
  userId: number;

  @IsString({ message: 'content must be a string' })
  @IsNotEmpty({ message: 'content should not be empty' })
  content: string;

  @IsNumber()
  @IsOptional()
  start?: number;

  @IsNumber()
  @IsOptional()
  end?: number;
}
