// src/types/request.ts
import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string; // Keep as string
    email: string;
    name?: string;
  };
}
