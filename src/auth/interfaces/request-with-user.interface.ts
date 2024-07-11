import { Request } from 'express';
import { User } from '@prisma/client'; // Adjust this import based on your project structure

export interface RequestWithUser extends Request {
  user: {
    id: string;
    userId: number;
    email: string;
    name?: string;
  };
}
