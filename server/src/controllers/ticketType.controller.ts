import type { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';
import { getIO } from '../config/socket.js';
import type { AuthRequest } from '../types/index.js';

const createSchema = z.object({
  name: z.string().min(2).max(100),
  price: z.number().positive(),
  description: z.string().max(500).optional(),
  icon: z.string().max(4).optional(),
});

const updateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  price: z.number().positive().optional(),
  description: z.string().max(500).nullable().optional(),
  icon: z.string().max(4).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

const toggleSchema = z.object({
  active: z.boolean(),
});

export async function listTicketTypes(req: AuthRequest, res: Response) {
  const user = req.user!;
  const where = user.role === 'AGENT' ? { active: true } : {};

  const types = await prisma.ticketType.findMany({
    where,
    orderBy: { sortOrder: 'asc' },
  });

  res.json(types);
}

export async function createTicketType(req: AuthRequest, res: Response) {
  const data = createSchema.parse(req.body);

  // Auto-assign sortOrder to end
  const maxSort = await prisma.ticketType.aggregate({ _max: { sortOrder: true } });
  const sortOrder = (maxSort._max.sortOrder ?? -1) + 1;

  const ticketType = await prisma.ticketType.create({
    data: {
      name: data.name,
      price: data.price,
      description: data.description,
      icon: data.icon ?? '🎫',
      sortOrder,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: req.user!.userId,
      action: 'TICKET_TYPE_CREATED',
      entityType: 'TicketType',
      entityId: ticketType.id,
      details: { name: ticketType.name, price: ticketType.price },
    },
  });

  try { getIO().emit('ticketType:created', ticketType); } catch {}

  res.status(201).json(ticketType);
}

export async function updateTicketType(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const data = updateSchema.parse(req.body);

  const existing = await prisma.ticketType.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'Ticket type not found');

  const ticketType = await prisma.ticketType.update({
    where: { id },
    data,
  });

  await prisma.auditLog.create({
    data: {
      userId: req.user!.userId,
      action: 'TICKET_TYPE_UPDATED',
      entityType: 'TicketType',
      entityId: ticketType.id,
      details: data,
    },
  });

  try { getIO().emit('ticketType:updated', ticketType); } catch {}

  res.json(ticketType);
}

export async function toggleTicketTypeStatus(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const { active } = toggleSchema.parse(req.body);

  const existing = await prisma.ticketType.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'Ticket type not found');

  const ticketType = await prisma.ticketType.update({
    where: { id },
    data: { active },
  });

  await prisma.auditLog.create({
    data: {
      userId: req.user!.userId,
      action: active ? 'TICKET_TYPE_ACTIVATED' : 'TICKET_TYPE_DEACTIVATED',
      entityType: 'TicketType',
      entityId: ticketType.id,
      details: { name: ticketType.name, active },
    },
  });

  try { getIO().emit('ticketType:updated', ticketType); } catch {}

  res.json(ticketType);
}

export async function deleteTicketType(req: AuthRequest, res: Response) {
  const id = req.params.id as string;

  const existing = await prisma.ticketType.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'Ticket type not found');

  // Check for existing sales
  const salesCount = await prisma.sale.count({ where: { ticketTypeId: id } });
  if (salesCount > 0) {
    throw new AppError(400, 'Cannot delete ticket type with existing sales. Deactivate instead.');
  }

  await prisma.ticketType.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      userId: req.user!.userId,
      action: 'TICKET_TYPE_DELETED',
      entityType: 'TicketType',
      entityId: id,
      details: { name: existing.name },
    },
  });

  try { getIO().emit('ticketType:deleted', { id }); } catch {}

  res.json({ deleted: true });
}
