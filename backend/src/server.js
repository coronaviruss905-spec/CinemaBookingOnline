import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { getPool } from './db.js';
import authRoutes from './routes/auth.js';
import movieRoutes from './routes/movies.js';
import showtimeRoutes from './routes/showtimes.js';
import bookingRoutes from './routes/bookings.js';
import adminRoutes from './routes/admin.js';
import { sendSqlError } from './utils/sqlError.js';

const app = express();
const PORT = Number(process.env.PORT || 5000);

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
          DB_NAME() AS DbName,
          @@SERVERNAME AS ServerName,
          CONVERT(VARCHAR(19), SYSDATETIME(), 126) AS ServerTime;
    `);
    const info = result.recordset[0] || {};
    return res.json({
      ok: true,
      dbName: info.DbName,
      serverName: info.ServerName,
      serverTime: info.ServerTime,
    });
  } catch (err) {
    return sendSqlError(res, err);
  }
});

app.use('/api/auth', authRoutes);
app.use('/api', movieRoutes);
app.use('/api/showtimes', showtimeRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Không tìm thấy endpoint API.' });
});

app.use((err, _req, res, _next) => {
  console.error('[EXPRESS ERROR]', err);
  res.status(500).json({ error: err.message || 'Lỗi máy chủ nội bộ.' });
});

async function start() {
  try {
    const pool = await getPool();
    const check = await pool.request().query(`SELECT DB_NAME() AS DbName, @@SERVERNAME AS ServerName;`);
    const info = check.recordset[0];
    console.log(`[DB] Connected to ${info.DbName} on ${info.ServerName}`);
  } catch (err) {
    console.error('[DB] Initial connection check failed (will retry on requests):', err.message);
  }

  app.listen(PORT, () => {
    console.log(`[API] Cinema Booking backend running at http://localhost:${PORT}`);
  });
}

start();
