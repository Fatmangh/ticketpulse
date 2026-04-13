import { prisma } from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';
import { DEFAULT_DAILY_INVENTORY } from '../utils/constants.js';

export async function checkInventory(userId: string, quantity: number): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get today's inventory cap
  const inventory = await prisma.inventory.findUnique({ where: { date: today } });
  const totalCap = inventory?.totalTickets ?? DEFAULT_DAILY_INVENTORY;

  // Get total sold today (globally)
  const globalSold = await prisma.sale.aggregate({
    where: {
      status: 'COMPLETED',
      createdAt: { gte: today, lt: tomorrow },
    },
    _sum: { quantity: true },
  });
  const totalSoldToday = globalSold._sum.quantity ?? 0;

  if (totalSoldToday + quantity > totalCap) {
    throw new AppError(400, `Daily inventory limit reached (${totalCap} tickets). ${totalCap - totalSoldToday} remaining.`);
  }

  // Get agent's allocation and today's sales
  const agent = await prisma.user.findUnique({
    where: { id: userId },
    select: { ticketAlloc: true },
  });

  if (!agent) throw new AppError(404, 'Agent not found');

  const agentSold = await prisma.sale.aggregate({
    where: {
      agentId: userId,
      status: 'COMPLETED',
      createdAt: { gte: today, lt: tomorrow },
    },
    _sum: { quantity: true },
  });
  const agentSoldToday = agentSold._sum.quantity ?? 0;

  if (agentSoldToday + quantity > agent.ticketAlloc) {
    throw new AppError(400, `Agent allocation limit reached (${agent.ticketAlloc} tickets). ${agent.ticketAlloc - agentSoldToday} remaining.`);
  }
}
