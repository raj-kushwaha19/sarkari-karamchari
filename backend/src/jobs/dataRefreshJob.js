const cron = require('node-cron');
const { runFullScrape } = require('../services/scraperService');
const logger = require('../utils/logger');

const startDataRefreshJob = () => {
  // Weekly on Monday at 2 AM
  cron.schedule('0 2 * * 1', async () => {
    logger.info('⏰ [DataRefresh] Weekly data refresh job started');
    try {
      const result = await runFullScrape();
      logger.info('✅ [DataRefresh] Weekly refresh complete:', JSON.stringify(result));
    } catch (err) {
      logger.error('❌ [DataRefresh] Weekly refresh job failed:', err);
    }
  }, {
    timezone: 'Asia/Kolkata',
  });
  
  logger.info('📅 [DataRefresh] Scheduled: weekly Monday 2AM IST');
};

module.exports = { startDataRefreshJob };
