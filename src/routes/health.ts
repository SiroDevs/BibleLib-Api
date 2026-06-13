import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';

const router = Router();

const stateNames: Record<number, string> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

/**
 * GET /api/v1/health
 * Server and database status. Safe for uptime monitors.
 */
router.get('/', (_req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState;
  const database = stateNames[dbState] || 'unknown';
  const healthy = dbState === 1;

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 200 : 503,
    api: 'v1',
    server: 'ok',
    database,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

export default router;
