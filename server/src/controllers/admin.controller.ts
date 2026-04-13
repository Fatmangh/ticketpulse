import type { Request, Response } from 'express';
import { prisma } from '../config/db.js';
import { DEFAULT_DAILY_INVENTORY } from '../utils/constants.js';

export async function getOverview(_req: Request, res: Response) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [salesAgg, ticketsScanned, inventory, activeAgents] = await Promise.all([
    prisma.sale.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: today, lt: tomorrow },
      },
      _sum: { totalAmount: true, commissionAmount: true, quantity: true },
      _count: true,
    }),
    prisma.ticket.count({
      where: {
        scannedAt: { gte: today, lt: tomorrow },
        status: 'SCANNED',
      },
    }),
    prisma.inventory.findUnique({ where: { date: today } }),
    prisma.user.count({ where: { role: 'AGENT', active: true } }),
  ]);

  const totalTickets = inventory?.totalTickets ?? DEFAULT_DAILY_INVENTORY;
  const soldToday = salesAgg._sum.quantity ?? 0;

  res.json({
    revenue: salesAgg._sum.totalAmount ?? 0,
    commission: salesAgg._sum.commissionAmount ?? 0,
    salesCount: salesAgg._count,
    ticketsSold: soldToday,
    ticketsScanned,
    scanRate: soldToday > 0 ? Math.round((ticketsScanned / soldToday) * 100) : 0,
    inventory: {
      total: totalTickets,
      sold: soldToday,
      remaining: totalTickets - soldToday,
    },
    activeAgents,
  });
}

export async function getFeed(_req: Request, res: Response) {
  const sales = await prisma.sale.findMany({
    include: {
      ticketType: true,
      agent: { select: { agentId: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  res.json(sales);
}
