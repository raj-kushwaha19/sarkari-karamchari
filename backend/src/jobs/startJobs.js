const { startWatchdogJob } = require('./watchdogJob');
const logger = require('../utils/logger');

const startAllJobs = () => {
  logger.info('[Jobs] Initializing all background jobs...');
  startWatchdogJob();
};

module.exports = { startAllJobs };
