import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db.js';
import { DEFAULT_DAILY_INVENTORY } from '../utils/constants.js';

function todayDate(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getTodayInventory(_req: Request, res: Response) {
  const today = todayDate();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  let inventory = await prisma.inventory.findUnique({ where: { date: today } });
  if (!inventory) {
    inventory = await prisma.inventory.create({
      data: { date: today, totalTickets: DEFAULT_DAILY_INVENTORY },
    });
  }

  const soldToday = await prisma.sale.aggregate({
    where: {
      status: 'COMPLETED',
      createdAt: { gte: today, lt: tomorrow },
    },
    _sum: { quantity: true },
  });

  res.json({
    date: today,
    totalTickets: inventory.totalTickets,
    soldToday: soldToday._sum.quantity ?? 0,
    remaining: inventory.totalTickets - (soldToday._sum.quantity ?? 0),
  });
}

const setInventorySchema = z.object({
  totalTickets: z.number().int().min(0),
});

export async function setTodayInventory(req: Request, res: Response) {
  const { totalTickets } = setInventorySchema.parse(req.body);
  const today = todayDate();

  const inventory = await prisma.inventory.upsert({
    where: { date: today },
    update: { totalTickets },
    create: { date: today, totalTickets },
  });

  res.json(inventory);
}
