import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { createSale, listSales, getSale, getMyToday } from '../controllers/sale.controller.js';

export const saleRoutes = Router();

saleRoutes.use(authenticate);
saleRoutes.post('/', createSale);
saleRoutes.get('/', listSales);
saleRoutes.get('/my/today', getMyToday);
saleRoutes.get('/:id', getSale);
