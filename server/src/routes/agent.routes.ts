import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { listAgents, createAgent, updateAgent, toggleAgentStatus, resetPin } from '../controllers/agent.controller.js';

export const agentRoutes = Router();

agentRoutes.use(authenticate);
agentRoutes.use(requireRole('ADMIN'));

agentRoutes.get('/', listAgents);
agentRoutes.post('/', createAgent);
agentRoutes.patch('/:id', updateAgent);
agentRoutes.patch('/:id/status', toggleAgentStatus);
agentRoutes.post('/:id/reset-pin', resetPin);
