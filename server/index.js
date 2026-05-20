const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { version } = require('./package.json');
require('dotenv').config();

const app = express();

// ─── Vercel Serverless DB Connection ──────────────────────────────────────────
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is missing in Vercel Environment Variables");

  // Connect to DB directly and throw if it fails so the middleware can catch it
  const db = await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000 // Timeout fast so Vercel doesn't crash
  });
  isConnected = db.connections[0].readyState;
  console.log('✅ MongoDB connected');
};

if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
  app.use(async (req, res, next) => {
    try {
      await connectDB();
      next();
    } catch (err) {
      // If DB fails to connect, return the exact error to the browser!
      console.error('Vercel DB Connection Error:', err);
      return res.status(500).json({
        success: false,
        message: 'Database Connection Failed',
        errorDetails: err.message
      });
    }
  });
}

// ─── Diagnostic Route ────────────────────────────────────────────────────────
app.get('/api/test-db', async (req, res) => {
  res.json({
    message: "Diagnostic Route",
    hasMongoUri: !!process.env.MONGO_URI,
    isConnected: isConnected
  });
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.set('trust proxy', 1);
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (!req.originalUrl.includes('/uploads')) {
      console.log(`\x1b[36m[PERF]\x1b[0m ${req.method} ${req.originalUrl} - ${res.statusCode} (\x1b[33m${duration}ms\x1b[0m)`);
    }
  });
  next();
});
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', globalLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get('/test', (req, res) => res.json({ success: true, message: 'Backend is working perfectly on port 5000!' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/users', require('./routes/users'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/admin', require('./routes/admin').router);
app.use('/api/bulk', require('./routes/bulk-operations'));
app.use('/api/returns', require('./routes/returns'));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version,
    server: 'LuxeStore API v1.0',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// If running in Vercel Serverless environment
if (process.env.VERCEL) {
  module.exports = app;
} else {
  // Local development or Render hosting
  const startServer = () => {
    const PORT = process.env.PORT || 5000;

    if (!process.env.JWT_SECRET) {
      console.error('❌ FATAL: JWT_SECRET environment variable is not set.');
      console.error('   Set JWT_SECRET in server/.env before starting the server.');
      process.exit(1);
    }

    // Connect to MongoDB in the background (non-blocking)
    mongoose.connect(process.env.MONGO_URI)
      .then(() => console.log('✅ MongoDB connected successfully'))
      .catch((err) => {
        console.warn('⚠️  MongoDB connection failed:', err.message);
        console.warn('   Running in demo mode — set MONGO_URI in server/.env to connect.');
      });

    // Start listening immediately so Render detects the port instantly
    app.listen(PORT, () => {
      console.log(`🚀 LuxeStore API running on http://localhost:${PORT}`);
      console.log(`📊 Admin: http://localhost:3000/admin`);
    });
  };

  startServer();
}
