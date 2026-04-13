import { Router } from 'express';
import { login, refresh, logout } from '../controllers/auth.controller.js';

export const authRoutes = Router();

authRoutes.post('/login', login);
authRoutes.post('/refresh', refresh);
authRoutes.post('/logout', logout);
