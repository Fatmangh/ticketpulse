import type { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';
import { COMMISSION_RATE } from '../utils/constants.js';
import { checkInventory } from '../services/inventory.service.js';
import { generateQRCode } from '../services/qr.service.js';
import { sendTicketEmail } from '../services/email.service.js';
import { processCloverPayment } from '../services/clover.service.js';
import { getIO } from '../config/socket.js';
import type { AuthRequest } from '../types/index.js';
import crypto from 'crypto';

const createSaleSchema = z.object({
  ticketTypeId: z.string(),
  quantity: z.number().int().min(1).max(50),
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerEmailConfirm: z.string().email(),
  paymentMethod: z.enum(['CLOVER', 'CASH']),
});

export async function createSale(req: AuthRequest, res: Response) {
  const data = createSaleSchema.parse(req.body);

  if (data.customerEmail !== data.customerEmailConfirm) {
    throw new AppError(400, 'Email addresses do not match');
  }

  const user = req.user!;

  const ticketType = await prisma.ticketType.findUnique({
    where: { id: data.ticketTypeId },
  });
  if (!ticketType || !ticketType.active) {
    throw new AppError(404, 'Ticket type not found or inactive');
  }

  // Check inventory
  await checkInventory(user.userId, data.quantity);

  const totalAmount = ticketType.price * data.quantity;
  const commissionAmount = totalAmount * COMMISSION_RATE;

  // Process payment
  let cloverPaymentId: string | null = null;
  if (data.paymentMethod === 'CLOVER') {
    cloverPaymentId = await processCloverPayment(totalAmount, `TicketPulse - ${data.quantity}x ${ticketType.name}`);
  }

  // Create sale + tickets in a transaction
  const sale = await prisma.$transaction(async (tx) => {
    const sale = await tx.sale.create({
      data: {
        agentId: user.userId,
        ticketTypeId: data.ticketTypeId,
        quantity: data.quantity,
        unitPrice: ticketType.price,
        totalAmount,
        commissionRate: COMMISSION_RATE,
        commissionAmount,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        paymentMethod: data.paymentMethod,
        cloverPaymentId,
      },
    });

    // Create individual tickets with unique QR codes
    const tickets = [];
    for (let i = 1; i <= data.quantity; i++) {
      const qrCode = `TP-${sale.id}-${i}-${crypto.randomBytes(4).toString('hex')}`;
      const ticket = await tx.ticket.create({
        data: {
          saleId: sale.id,
          qrCode,
          ticketNumber: i,
        },
      });
      tickets.push(ticket);
    }

    // Audit log
    await tx.auditLog.create({
      data: {
        userId: user.userId,
        action: 'SALE_CREATED',
        entityType: 'Sale',
        entityId: sale.id,
        details: { quantity: data.quantity, totalAmount, paymentMethod: data.paymentMethod },
      },
    });

    return { ...sale, tickets };
  });

  // Generate QR codes and send email (async, don't block response)
  sendTicketEmail(sale, sale.tickets, ticketType).catch((err) => {
    console.error('Failed to send ticket email:', err);
  });

  // Emit real-time event
  try {
    getIO().emit('sale:created', {
      id: sale.id,
      agentId: user.agentId,
      quantity: sale.quantity,
      totalAmount: sale.totalAmount,
      ticketType: ticketType.name,
      createdAt: sale.createdAt,
    });
  } catch {
    // Socket not critical
  }

  res.status(201).json(sale);
}

export async function listSales(req: AuthRequest, res: Response) {
  const { status, date, agentId: filterAgentId } = req.query;
  const user = req.user!;

  const where: Record<string, unknown> = {};

  if (user.role === 'AGENT') {
    where.agentId = user.userId;
  } else if (filterAgentId) {
    where.agentId = filterAgentId;
  }

  if (status === 'COMPLETED' || status === 'REFUNDED') {
    where.status = status;
  }

  if (date) {
    const d = new Date(date as string);
    where.createdAt = {
      gte: new Date(d.setHours(0, 0, 0, 0)),
      lt: new Date(d.setHours(24, 0, 0, 0)),
    };
  }

  const sales = await prisma.sale.findMany({
    where,
    include: { ticketType: true, agent: { select: { agentId: true, name: true } }, tickets: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  res.json(sales);
}

export async function getSale(req: AuthRequest, res: Response) {
  const sale = await prisma.sale.findUnique({
    where: { id: req.params.id },
    include: {
      ticketType: true,
      agent: { select: { agentId: true, name: true } },
      tickets: true,
    },
  });

  if (!sale) throw new AppError(404, 'Sale not found');

  // Agents can only see their own sales
  if (req.user!.role === 'AGENT' && sale.agentId !== req.user!.userId) {
    throw new AppError(403, 'Not authorized to view this sale');
  }

  res.json(sale);
}

export async function getMyToday(req: AuthRequest, res: Response) {
  const user = req.user!;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const sales = await prisma.sale.findMany({
    where: {
      agentId: user.userId,
      createdAt: { gte: today, lt: tomorrow },
    },
    include: { ticketType: true, tickets: true },
    orderBy: { createdAt: 'desc' },
  });

  const completedSales = sales.filter((s) => s.status === 'COMPLETED');
  const totalRevenue = completedSales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalCommission = completedSales.reduce((sum, s) => sum + s.commissionAmount, 0);
  const totalTickets = completedSales.reduce((sum, s) => sum + s.quantity, 0);

  res.json({
    sales,
    summary: {
      totalSales: completedSales.length,
      totalRevenue,
      totalCommission,
      totalTickets,
    },
  });
}
