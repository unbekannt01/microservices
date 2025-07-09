// src/@types/express/index.d.ts
import { JwtPayload } from 'src/payload/jwt.payload';

declare module 'express' {
  export interface Request {
    user?: JwtPayload & { id: string };
  }
}
