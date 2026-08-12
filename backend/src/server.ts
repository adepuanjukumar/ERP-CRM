import app from './app';
import { config } from './config/env';
import { checkDatabaseConnection } from './config/database';

const PORT = config.port;

async function bootstrap() {
  console.log('----------------------------------------------------');
  console.log(`🚀 Starting Mini ERP + CRM Server [${config.nodeEnv}]`);
  console.log('----------------------------------------------------');

  // Verify PostgreSQL Database Connection
  const dbHealth = await checkDatabaseConnection();
  if (dbHealth.connected) {
    console.log(`✅ ${dbHealth.message}`);
  } else {
    console.warn(`⚠️ ${dbHealth.message}`);
  }

  app.listen(PORT, () => {
    console.log(`📡 Backend Server listening on http://localhost:${PORT}`);
    console.log(`🏥 Health Check URL: http://localhost:${PORT}/api/health`);
    console.log(`💾 Database Health URL: http://localhost:${PORT}/api/health/db`);
    console.log('----------------------------------------------------');
  });
}

bootstrap();
