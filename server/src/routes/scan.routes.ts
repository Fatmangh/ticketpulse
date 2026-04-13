import { Router } from 'express';
import { scanTicket } from '../controllers/scan.controller.js';

export const scanRoutes = Router();

scanRoutes.post('/', scanTicket);
