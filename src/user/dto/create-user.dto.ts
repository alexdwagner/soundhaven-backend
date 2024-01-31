// src/user/dto/create-user.dto.ts

import { IsEmail, IsString, Length, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(8, 20)
  password: string;

  @IsString()
  name: string;
}
