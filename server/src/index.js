import express from 'express';
import http from 'node:http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { connectDB } from './db.js';
import routes from './routes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { initRealtime } from './realtime.js';
import { seed } from './seed.js';

const app = express();
const server = http.createServer(app);

// Express 5 + path-to-regexp v8 breaks wildcard routes; keep it simple:
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: [config.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
if (config.env !== 'test') app.use(morgan('dev'));

// Basic abuse protection on auth + order endpoints
app.use(
  '/api/auth/login',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false })
);
app.use(
  '/api/orders',
  rateLimit({ windowMs: 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false })
);

app.use('/api', routes);

// API 404 + error handler (registered before static SPA fallback)
app.use('/api', notFound);
app.use(errorHandler);

// Serve the built client in production (single-service deploy)
const distDir = new URL('../../client/dist', import.meta.url).pathname;
app.use(express.static(distDir));
app.get(/^(?!\/api).*/, (_req, res) => {
  res.sendFile(new URL('../../client/dist/index.html', import.meta.url).pathname);
});

initRealtime(server);

const PORT = config.port;
server.listen(PORT, '0.0.0.0', async () => {
  console.log(`[symbieat] API + client on http://0.0.0.0:${PORT} (${config.isDemo ? 'DEMO mode' : 'Atlas'})`);
  try {
    await connectDB();
    await seed();
  } catch (err) {
    console.error('[symbieat] DB connection failed:', err.message);
    process.exit(1);
  }
});
