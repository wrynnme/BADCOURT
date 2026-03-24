// ════ BadCourt Backend Entry Point ════
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sessionsRouter } from './routes/sessions.js';
import { registrationsRouter } from './routes/registrations.js';
import { matchesRouter } from './routes/matches.js';
import { paymentsRouter } from './routes/payments.js';
import { statsRouter } from './routes/stats.js';
import { adminRouter } from './routes/admin.js';
import { startCronJobs } from './services/cronJobs.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/sessions', sessionsRouter);
app.use('/api/registrations', registrationsRouter);
app.use('/api/matches', matchesRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/admin', adminRouter);

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Error]', err);
  res.status(500).json({ success: false, error: err.message || 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 BadCourt Backend running on port ${PORT}`);
  
  // Start cron jobs
  startCronJobs();
});
