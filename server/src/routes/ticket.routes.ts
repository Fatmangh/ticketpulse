import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { listTicketTypes } from '../controllers/ticket.controller.js';

export const ticketRoutes = Router();

ticketRoutes.use(authenticate);
ticketRoutes.get('/types', listTicketTypes);
