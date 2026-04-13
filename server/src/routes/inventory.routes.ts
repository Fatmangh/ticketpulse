import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { getTodayInventory, setTodayInventory } from '../controllers/inventory.controller.js';

export const inventoryRoutes = Router();

inventoryRoutes.use(authenticate);
inventoryRoutes.use(requireRole('ADMIN'));

inventoryRoutes.get('/today', getTodayInventory);
inventoryRoutes.put('/today', setTodayInventory);
