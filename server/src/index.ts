import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { env } from './config/env.js';
import { initSocket } from './config/socket.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authRoutes } from './routes/auth.routes.js';
import { saleRoutes } from './routes/sale.routes.js';
import { refundRoutes } from './routes/refund.routes.js';
import { scanRoutes } from './routes/scan.routes.js';
import { agentRoutes } from './routes/agent.routes.js';
import { inventoryRoutes } from './routes/inventory.routes.js';
import { adminRoutes } from './routes/admin.routes.js';
import { ticketRoutes } from './routes/ticket.routes.js';

const app = express();
const httpServer = createServer(app);

initSocket(httpServer);

app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/refunds', refundRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tickets', ticketRoutes);

app.use(errorHandler);

httpServer.listen(env.PORT, () => {
  console.log(`TicketPulse server running on port ${env.PORT}`);
});

export { app, httpServer };
