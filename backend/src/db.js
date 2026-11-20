import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const useSqlAuth = (process.env.DB_AUTH || 'windows').toLowerCase() === 'sql';
const sql = useSqlAuth ? require('mssql') : require('mssql/msnodesqlv8');

function buildConfig() {
  const server = process.env.DB_SERVER || 'localhost';
  const database = process.env.DB_NAME || 'CinemaBookingDB';

  if (useSqlAuth) {
    return {
      server,
      port: Number(process.env.DB_PORT || 1433),
      database,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      options: {
        encrypt: false,
        trustServerCertificate: true,
      },
      pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
    };
  }

  const driver = process.env.DB_DRIVER || 'ODBC Driver 17 for SQL Server';
  return {
    connectionString: `Driver={${driver}};Server=${server};Database=${database};Trusted_Connection=yes;TrustServerCertificate=yes;`,
    pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
  };
}

let poolPromise = null;

/**
 * Return a shared SQL Server ConnectionPool, lazily connecting and resetting on failure.
 */
export async function getPool() {
  if (!poolPromise) {
    const pool = new sql.ConnectionPool(buildConfig());
    poolPromise = pool.connect().catch((err) => {
      poolPromise = null;
      throw err;
    });
  }
  return poolPromise;
}

/**
 * Coerce SQL Server BIGINT / DECIMAL values to JS Number safely.
 */
export function toNumber(value, fallback = 0) {
  if (value === null || value === undefined) return fallback;
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

export { sql };
