const cron = require('node-cron');
const Complaint = require('../models/Complaint');
const logger = require('../utils/logger');

// Run every night at midnight: '0 0 * * *'
// For demo purposes, we can run it every 5 minutes: '*/5 * * * *' 
// Or we just calculate the exact days.

const startCronJobs = () => {
  logger.info('[CRON] Starting Escalation Engine Job...');

  cron.schedule('0 * * * *', async () => {
    // Runs every hour
    logger.info('[CRON] Running Complaint Escaltion Check...');
    
    try {
      const now = new Date();
      
      // 1. Find complaints that need Follow-up (5 days passed, level 0)
      const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
      
      const toFollowUp = await Complaint.find({
        status: { $nin: ['resolved', 'rejected'] },
        escalationLevel: 0,
        createdAt: { $lte: fiveDaysAgo },
        userActionRequired: 'none'
      });

      for (let c of toFollowUp) {
        c.userActionRequired = 'needs_followup';
        await c.save();
        logger.info(`[CRON] Complaint ${c._id} flagged for follow-up.`);
      }

      // 2. Find complaints that need Escalation (4 days since follow up, level 1)
      const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
      
      const toEscalate = await Complaint.find({
        status: { $nin: ['resolved', 'rejected'] },
        escalationLevel: 1,
        followUpSentAt: { $lte: fourDaysAgo },
        userActionRequired: 'none'
      });

      for (let c of toEscalate) {
        c.userActionRequired = 'needs_escalation';
        await c.save();
        logger.info(`[CRON] Complaint ${c._id} flagged for escalation.`);
      }

    } catch (err) {
      logger.error('[CRON] Error running escalation checks:', err.message);
    }
  });
};

module.exports = { startCronJobs };
