require('dotenv').config({ quiet: true });

const express = require('express');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const cors = require('cors');
const multer = require('multer');
const pool = require('./db');
const passport = require('./config/passport');
const authRoutes = require('./routes/auth');
const contentsRoutes = require('./routes/contents');

const app = express();

app.set('trust proxy', 1);

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev_secret',
    resave: false,
    saveUninitialized: false,
    proxy: true,
    store: new MemoryStore({
      checkPeriod: 86400000,
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      // 'none' is required in production so the cookie survives cross-site
      // requests from the Vercel frontend to the Render backend.
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', authRoutes);
app.use('/api/contents', contentsRoutes);

app.get('/healthz', (_req, res) => res.send('ok'));

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'File too large (max 50 MB)' : err.message;
    return res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ message });
  }
  if (err.status) return res.status(err.status).json({ message: err.message });
  console.error(err);
  res.status(500).json({ message: 'Server error' });
});

async function checkDatabase() {
  try {
    await pool.query('SELECT 1');
    console.log('[DB] Connected to TiDB Cloud MySQL successfully.');
  } catch (err) {
    console.error('[DB] Failed to connect to TiDB Cloud MySQL.');
    console.error('[DB]   ->', err.message);
    console.error('[DB]   Check MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD,');
    console.error('[DB]   MYSQL_DATABASE and MYSQL_PORT (default 4000) in .env');
  }
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  checkDatabase();
});