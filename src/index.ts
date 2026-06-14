import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// v1 routes
import { health, bibles, books, chapters, verses } from './routes';

// swagger docs
import swaggerRouter from './swagger';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: './.env' });
}

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['*'];

app.use(
  cors({
    origin: allowedOrigins.includes('*') ? '*' : allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-api-key'],
  })
);

mongoose
  .connect(process.env.ATLAS_URI as string, { authSource: 'admin' })
  .then(() => console.log('MongoDB connected ...'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.use(express.json({ limit: '50mb' }));

app.use('/', swaggerRouter);

app.use('/api/v1/health',   health);
app.use('/api/v1/bibles',   bibles);
app.use('/api/v1/books',    books);
app.use('/api/v1/chapters', chapters);
app.use('/api/v1/verses',   verses);

app.get('/api', (_req: Request, res: Response) => {
  res.json({
    name: 'BibleLib API',
    version: '1.0.0',
    docs: '/api/v1/docs',
    health: '/api/v1/health',
  });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ status: 404, error: 'Not found' });
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ status: 500, error: 'Internal server error' });
});

export default app;

if (process.env.VERCEL !== '1' && require.main === module) {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => console.log(`BibleLib server running on port ${PORT}`));
}
