import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db.js';
import { verifyPin } from '../utils/pin.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { AppError } from '../middleware/errorHandler.js';

const loginSchema = z.object({
  agentId: z.string().min(1),
  pin: z.string().min(4).max(6),
});

export async function login(req: Request, res: Response) {
  const { agentId, pin } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { agentId } });
  if (!user || !user.active) {
    throw new AppError(401, 'Invalid credentials');
  }

  const valid = await verifyPin(pin, user.pinHash);
  if (!valid) {
    throw new AppError(401, 'Invalid credentials');
  }

  const payload = { userId: user.id, agentId: user.agentId, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  res.json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      agentId: user.agentId,
      name: user.name,
      role: user.role,
      email: user.email,
      ticketAlloc: user.ticketAlloc,
    },
  });
}

export async function refresh(req: Request, res: Response) {
  const { refreshToken } = z.object({ refreshToken: z.string() }).parse(req.body);

  try {
    const payload = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.active) {
      throw new AppError(401, 'User not found or deactivated');
    }

    const newPayload = { userId: user.id, agentId: user.agentId, role: user.role };
    const accessToken = signAccessToken(newPayload);

    res.json({ accessToken });
  } catch {
    throw new AppError(401, 'Invalid refresh token');
  }
}

export async function logout(_req: Request, res: Response) {
  // Stateless JWT — client discards tokens
  res.json({ message: 'Logged out' });
}
