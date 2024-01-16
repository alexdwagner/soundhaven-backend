// types/express/index.d.ts
import 'express';

declare module 'express-serve-static-core' {
  interface Request {
    user?: { id: string; email: string; name?: string }; // Adapt this to the shape of your user object
  }
}
