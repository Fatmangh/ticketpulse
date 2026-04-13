import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { searchRefundable, processRefund } from '../controllers/refund.controller.js';

export const refundRoutes = Router();

refundRoutes.use(authenticate);
refundRoutes.get('/search', searchRefundable);
refundRoutes.post('/:saleId', processRefund);
