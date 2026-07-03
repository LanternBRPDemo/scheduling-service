import 'dotenv/config';
import { createApp } from './app';
import { db } from './config/database';

const PORT = process.env.SERVICE_PORT || 4010;
const SERVICE_NAME = process.env.SERVICE_NAME || 'scheduling-service';

async function startServer() {
  try {
    // Create and start Express app immediately for health checks
    const app = createApp(db);

    app.listen(PORT, () => {
      console.log(`🚀 ${SERVICE_NAME} running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Test database connection asynchronously
    db.raw('SELECT 1')
      .then(() => {
        console.log('✅ Database connected successfully');
      })
      .catch((error) => {
        console.error('⚠️ Database connection failed:', error.message);
        console.log('Service continues running for health checks...');
      });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down gracefully...');
  await db.destroy();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n👋 Shutting down gracefully...');
  await db.destroy();
  process.exit(0);
});

startServer();