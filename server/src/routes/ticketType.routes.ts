import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import {
  listTicketTypes,
  createTicketType,
  updateTicketType,
  toggleTicketTypeStatus,
  deleteTicketType,
} from '../controllers/ticketType.controller.js';

export const ticketTypeRoutes = Router();

ticketTypeRoutes.use(authenticate);

ticketTypeRoutes.get('/', listTicketTypes);
ticketTypeRoutes.post('/', requireRole('ADMIN'), createTicketType);
ticketTypeRoutes.patch('/:id', requireRole('ADMIN'), updateTicketType);
ticketTypeRoutes.patch('/:id/status', requireRole('ADMIN'), toggleTicketTypeStatus);
ticketTypeRoutes.delete('/:id', requireRole('ADMIN'), deleteTicketType);
