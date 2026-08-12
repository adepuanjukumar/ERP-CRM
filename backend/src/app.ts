import express, { Request, Response } from 'express';
import cors from 'cors';
import { checkDatabaseConnection } from './config/database';
import { config } from './config/env';
import authRoutes from './routes/authRoutes';
import customerRoutes from './routes/customerRoutes';
import productRoutes from './routes/productRoutes';
import stockMovementRoutes from './routes/stockMovementRoutes';
import salesChallanRoutes from './routes/salesChallanRoutes';
import testRoutes from './routes/testRoutes';

const app = express();

// Middlewares
const corsOptions = {
  origin: config.corsOrigin === '*' ? '*' : config.corsOrigin.split(',').map((o) => o.trim()),
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic Health Check Endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'Mini ERP + CRM Backend API is operational',
    timestamp: new Date().toISOString(),
  });
});

// PostgreSQL Database Health Check Endpoint
app.get('/api/health/db', async (req: Request, res: Response) => {
  const dbHealth = await checkDatabaseConnection();
  if (dbHealth.connected) {
    res.status(200).json({
      status: 'ok',
      database: dbHealth,
    });
  } else {
    res.status(503).json({
      status: 'error',
      database: dbHealth,
      hint: 'Ensure PostgreSQL service is running locally on DB_HOST:DB_PORT with credentials in backend/.env',
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stock-movements', stockMovementRoutes);
app.use('/api/sales-challans', salesChallanRoutes);
app.use('/api/test', testRoutes);

// Catch-all 404 handler for undefined routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.method} ${req.originalUrl}`,
  });
});

export default app;
