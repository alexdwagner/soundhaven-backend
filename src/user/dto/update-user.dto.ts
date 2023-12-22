import { IsEmail, IsString, Length, IsOptional } from 'class-validator';

export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @Length(8, 20)
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  name?: string;
}
