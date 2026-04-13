import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db.js';
import { hashPin } from '../utils/pin.js';
import { AppError } from '../middleware/errorHandler.js';
import type { AuthRequest } from '../types/index.js';

export async function listAgents(_req: Request, res: Response) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const agents = await prisma.user.findMany({
    where: { role: 'AGENT' },
    select: {
      id: true,
      agentId: true,
      name: true,
      email: true,
      phone: true,
      active: true,
      ticketAlloc: true,
      createdAt: true,
      sales: {
        where: {
          createdAt: { gte: today, lt: tomorrow },
          status: 'COMPLETED',
        },
        select: { quantity: true, totalAmount: true, commissionAmount: true },
      },
    },
    orderBy: { agentId: 'asc' },
  });

  const result = agents.map((agent) => ({
    ...agent,
    todayStats: {
      salesCount: agent.sales.length,
      ticketsSold: agent.sales.reduce((sum, s) => sum + s.quantity, 0),
      revenue: agent.sales.reduce((sum, s) => sum + s.totalAmount, 0),
      commission: agent.sales.reduce((sum, s) => sum + s.commissionAmount, 0),
    },
    sales: undefined,
  }));

  res.json(result);
}

const createAgentSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  ticketAlloc: z.number().int().min(0).optional(),
});

export async function createAgent(req: AuthRequest, res: Response) {
  const data = createAgentSchema.parse(req.body);

  // Generate next agent ID
  const lastAgent = await prisma.user.findFirst({
    where: { role: 'AGENT', agentId: { startsWith: 'A' } },
    orderBy: { agentId: 'desc' },
  });

  const nextNum = lastAgent ? parseInt(lastAgent.agentId.slice(1)) + 1 : 1;
  const agentId = `A${String(nextNum).padStart(3, '0')}`;

  // Generate a random 4-digit PIN
  const pin = String(Math.floor(1000 + Math.random() * 9000));
  const pinHash = await hashPin(pin);

  const user = await prisma.user.create({
    data: {
      agentId,
      name: data.name,
      pinHash,
      role: 'AGENT',
      email: data.email,
      phone: data.phone,
      ticketAlloc: data.ticketAlloc ?? 50,
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: req.user!.userId,
      action: 'AGENT_CREATED',
      entityType: 'User',
      entityId: user.id,
      details: { agentId, name: data.name },
    },
  });

  // Return PIN only on creation
  res.status(201).json({
    id: user.id,
    agentId: user.agentId,
    name: user.name,
    pin,
    email: user.email,
    phone: user.phone,
    ticketAlloc: user.ticketAlloc,
  });
}

const updateAgentSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  ticketAlloc: z.number().int().min(0).optional(),
});

export async function updateAgent(req: Request, res: Response) {
  const id = req.params.id as string;
  const data = updateAgentSchema.parse(req.body);

  const agent = await prisma.user.findUnique({ where: { id } });
  if (!agent) throw new AppError(404, 'Agent not found');

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, agentId: true, name: true, email: true, phone: true, ticketAlloc: true, active: true },
  });

  res.json(updated);
}

export async function toggleAgentStatus(req: Request, res: Response) {
  const id = req.params.id as string;

  const agent = await prisma.user.findUnique({ where: { id } });
  if (!agent) throw new AppError(404, 'Agent not found');

  const updated = await prisma.user.update({
    where: { id },
    data: { active: !agent.active },
    select: { id: true, agentId: true, name: true, active: true },
  });

  res.json(updated);
}

export async function resetPin(req: AuthRequest, res: Response) {
  const id = req.params.id as string;

  const agent = await prisma.user.findUnique({ where: { id } });
  if (!agent) throw new AppError(404, 'Agent not found');

  const pin = String(Math.floor(1000 + Math.random() * 9000));
  const pinHash = await hashPin(pin);

  await prisma.user.update({
    where: { id },
    data: { pinHash },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: req.user!.userId,
      action: 'PIN_RESET',
      entityType: 'User',
      entityId: agent.id,
      details: { agentId: agent.agentId },
    },
  });

  res.json({ agentId: agent.agentId, pin });
}
