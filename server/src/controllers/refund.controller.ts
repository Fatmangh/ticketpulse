import type { Response } from 'express';
import { prisma } from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';
import { REFUND_WINDOW_DAYS } from '../utils/constants.js';
import { processCloverRefund } from '../services/clover.service.js';
import { getIO } from '../config/socket.js';
import type { AuthRequest } from '../types/index.js';

export async function searchRefundable(req: AuthRequest, res: Response) {
  const q = req.query.q;
  if (!q || typeof q !== 'string') {
    throw new AppError(400, 'Search query required');
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - REFUND_WINDOW_DAYS);

  const sales = await prisma.sale.findMany({
    where: {
      status: 'COMPLETED',
      createdAt: { gte: cutoffDate },
      OR: [
        { orderNumber: { contains: q, mode: 'insensitive' } },
        { customerEmail: { contains: q, mode: 'insensitive' } },
        { customerName: { contains: q, mode: 'insensitive' } },
      ],
    },
    include: {
      ticketType: true,
      agent: { select: { agentId: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  res.json(sales);
}

export async function processRefund(req: AuthRequest, res: Response) {
  const saleId = req.params.saleId as string;
  const user = req.user!;

  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: { tickets: true },
  });

  if (!sale) throw new AppError(404, 'Sale not found');
  if (sale.status === 'REFUNDED') throw new AppError(400, 'Sale already refunded');

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - REFUND_WINDOW_DAYS);
  if (sale.createdAt < cutoffDate) {
    throw new AppError(400, `Refund window expired (${REFUND_WINDOW_DAYS} days)`);
  }

  // Process Clover refund if applicable
  if (sale.paymentMethod === 'CLOVER' && sale.cloverPaymentId) {
    await processCloverRefund(sale.cloverPaymentId, sale.totalAmount);
  }

  const ticketCount = sale.tickets.length;

  const updatedSale = await prisma.$transaction(async (tx) => {
    const updated = await tx.sale.update({
      where: { id: saleId },
      data: {
        status: 'REFUNDED',
        refundedAt: new Date(),
        refundedById: user.userId,
      },
    });

    // Void all tickets
    await tx.ticket.updateMany({
      where: { saleId },
      data: { status: 'VOIDED' },
    });

    // Audit log
    await tx.auditLog.create({
      data: {
        userId: user.userId,
        action: 'REFUND_PROCESSED',
        entityType: 'Sale',
        entityId: saleId,
        details: { totalAmount: sale.totalAmount, ticketCount },
      },
    });

    return updated;
  });

  // Emit real-time event
  try {
    getIO().emit('sale:refunded', {
      id: sale.id,
      totalAmount: sale.totalAmount,
      refundedBy: user.agentId,
    });
  } catch {
    // Socket not critical
  }

  res.json(updatedSale);
}
