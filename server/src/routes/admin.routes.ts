import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { getOverview, getFeed } from '../controllers/admin.controller.js';

export const adminRoutes = Router();

adminRoutes.use(authenticate);
adminRoutes.use(requireRole('ADMIN'));

adminRoutes.get('/overview', getOverview);
adminRoutes.get('/feed', getFeed);
