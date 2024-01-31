import { ApiProperty } from '@nestjs/swagger';

export class TokenDto {
  @ApiProperty({
    description: 'JWT token to be validated',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVC9...',
  })
  token: string;
}