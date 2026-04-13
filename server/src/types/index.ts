import type { Request } from 'express';
import type { Role } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  agentId: string;
  role: Role;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}
