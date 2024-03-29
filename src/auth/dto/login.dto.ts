import { IsEmail, IsString, Length } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @IsString({ message: 'Password must be a string' })
  @Length(8, 20, {
    message: 'Password must be between 8 and 20 characters long',
  })
  password: string;
}