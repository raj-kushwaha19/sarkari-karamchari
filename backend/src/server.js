require('dotenv').config();
require('dns').setDefaultResultOrder('ipv4first'); // FORCE IPv4 GLOBALLY
const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();

  // Start background jobs after DB is connected
  try {
    const { startAllJobs } = require('./jobs/startJobs');
    startAllJobs();
  } catch (err) {
    logger.warn('[Server] Background jobs not started (jobs module may not be ready):', err.message);
  }

  app.listen(PORT, () => {
    logger.info(`🚀 Sarkari Karamchari backend running on port ${PORT}`);
    logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
  });
};

start();
