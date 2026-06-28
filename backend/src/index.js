require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const analyzeRouter = require('./routes/analyze');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Security Middleware ─────────────────────
app.use(helmet());

// ── CORS ────────────────────────────────────
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Rate Limiting ────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
  },
});
app.use('/api', limiter);

// ── Body Parser ──────────────────────────────
app.use(express.json({ limit: '10kb' }));

// ── Routes ───────────────────────────────────
app.use('/api', analyzeRouter);

// Root
app.get('/', (req, res) => {
  res.json({
    message: 'SafeText AI Backend',
    version: '1.0.0',
    endpoints: {
      analyze: 'POST /api/analyze',
      health: 'GET /api/health',
    },
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Something went wrong' });
});

// ── Start Server ──────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🛡️  SafeText AI Backend running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
});
