require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { initDB } = require('./config/db');
const { initSocket } = require('./socket');
const errorHandler = require('./middleware/errorHandler');

async function startServer() {
  // Initialize database first
  await initDB();
  console.log('Base de données initialisée');

  const app = express();
  const server = http.createServer(app);

  // Initialize Socket.io
  initSocket(server);

  // Middleware
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? true : (process.env.CLIENT_URL || 'http://localhost:5173'),
    credentials: true
  }));
  app.use(morgan('dev'));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { error: 'Trop de requêtes, veuillez réessayer plus tard' }
  });
  app.use('/api/', limiter);

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Trop de tentatives de connexion' }
  });
  app.use('/api/admin/login', authLimiter);

  // Routes (loaded after DB init)
  app.use('/api/products', require('./routes/products'));
  app.use('/api/categories', require('./routes/categories'));
  app.use('/api/orders', require('./routes/orders'));
  app.use('/api/payments', require('./routes/payments'));
  app.use('/api/admin', require('./routes/admin'));
  app.use('/api/stats', require('./routes/stats'));

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
    });
  }

  app.use(errorHandler);

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`Serveur Kulturama démarré sur le port ${PORT}`);
    console.log(`API: http://localhost:${PORT}/api`);
  });
}

startServer().catch(console.error);
