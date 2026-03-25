import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import authRoutes from './routes/auth.routes.js';
import childrenRoutes from './routes/children.routes.js';
import choresRoutes from './routes/chores.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';

const app = express();

// CORS – allow Live Server on both http://localhost:5500 and http://127.0.0.1:5500
const allowedOrigins = [
  process.env.FRONTEND_ORIGIN,
  'http://localhost:5500',
  'http://127.0.0.1:5500',
];

app.use(
  cors({
    origin: (origin, cb) => {
      // allow requests with no origin (Postman, curl) and whitelisted origins
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: false, // JWT is in Authorization header, not cookies
  })
);

app.use(express.json());

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/children', childrenRoutes);
app.use('/api/chores', choresRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
});

export default app;
