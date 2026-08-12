import { Pool, QueryResult, PoolClient } from 'pg';
import { config } from './env';

// Create PostgreSQL connection pool using environment variables
export const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.name,
  user: config.db.user,
  password: config.db.password,
  max: 20, // Maximum pool connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Event listener for pool errors
pool.on('error', (err: Error) => {
  console.error('❌ Unexpected PostgreSQL Pool Error:', err.message);
});

// Generic query helper
export const query = async (text: string, params?: any[]): Promise<QueryResult> => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (config.nodeEnv === 'development') {
      console.log(`⏱️ Executed query (${duration}ms):`, { text: text.substring(0, 100), rows: res.rowCount });
    }
    return res;
  } catch (error: any) {
    console.error('❌ Database Query Error:', error.message);
    throw error;
  }
};

// Checkout client helper for SQL Transactions
export const getClient = async (): Promise<PoolClient> => {
  return await pool.connect();
};

// Database connection health check
export const checkDatabaseConnection = async (): Promise<{ connected: boolean; message: string; timestamp?: string }> => {
  try {
    const res = await pool.query('SELECT NOW() as current_time, current_database() as db_name');
    const { current_time, db_name } = res.rows[0];
    return {
      connected: true,
      message: `Successfully connected to PostgreSQL database "${db_name}"`,
      timestamp: current_time,
    };
  } catch (error: any) {
    console.error('❌ PostgreSQL Health Check Failed:', error.message);
    return {
      connected: false,
      message: `Failed to connect to PostgreSQL: ${error.message}`,
    };
  }
};
