// ============================================================
// server.js — Blood Bank API Server (Express.js)
// ============================================================

require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');

const authRoutes     = require('./routes/auth.routes');
const donorRoutes    = require('./routes/donor.routes');
const hospitalRoutes = require('./routes/hospital.routes');
const bloodRoutes    = require('./routes/blood.routes');
const adminRoutes    = require('./routes/admin.routes');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Security Middleware ──
app.use(helmet());
app.use(cors({ origin: '*' })); // Restrict in production
app.use(express.json());

// ── Health Check ──
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── API Routes ──
app.use('/api/auth',      authRoutes);
app.use('/api/donors',    donorRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/blood',     bloodRoutes);
app.use('/api/admin',     adminRoutes);

// ── 404 Handler ──
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Error Handler ──
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`\n🩸 Blood Bank API running on http://localhost:${PORT}\n`);
});
