import type { Request, Response } from 'express';
import { prisma } from '../config/db.js';

export async function listTicketTypes(_req: Request, res: Response) {
  const types = await prisma.ticketType.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
  });
  res.json(types);
}
