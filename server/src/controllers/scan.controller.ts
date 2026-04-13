import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db.js';

const scanSchema = z.object({
  qrCode: z.string().min(1),
});

export async function scanTicket(req: Request, res: Response) {
  const { qrCode } = scanSchema.parse(req.body);

  const ticket = await prisma.ticket.findUnique({
    where: { qrCode },
    include: {
      sale: {
        include: {
          ticketType: true,
        },
      },
    },
  });

  if (!ticket) {
    res.json({ valid: false, reason: 'not_found' });
    return;
  }

  if (ticket.status === 'VOIDED') {
    res.json({ valid: false, reason: 'refunded', ticket });
    return;
  }

  if (ticket.status === 'SCANNED') {
    res.json({ valid: false, reason: 'already_scanned', scannedAt: ticket.scannedAt, ticket });
    return;
  }

  // Mark as scanned
  const updated = await prisma.ticket.update({
    where: { id: ticket.id },
    data: { status: 'SCANNED', scannedAt: new Date() },
    include: {
      sale: {
        include: {
          ticketType: true,
        },
      },
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      action: 'TICKET_SCANNED',
      entityType: 'Ticket',
      entityId: ticket.id,
      details: { qrCode, saleId: ticket.saleId },
    },
  });

  res.json({
    valid: true,
    ticket: updated,
    customerName: updated.sale.customerName,
    ticketType: updated.sale.ticketType.name,
  });
}
