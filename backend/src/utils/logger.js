const fs = require('fs');
const path = require('path');
const formatTimestamp = () => new Date().toISOString();

const logFilePath = path.join(__dirname, '..', '..', 'backend.log');

const writeLog = (level, ...args) => {
  if (process.env.NODE_ENV === 'production') return; // Don't write to disk on Render
  const msg = `[${formatTimestamp()}] [${level}] ` + args.map(a => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' ') + '\n';
  try {
    fs.appendFileSync(logFilePath, msg);
  } catch (e) {
    // Ignore log write errors
  }
};

const logger = {
  info: (...args) => { console.log(`[${formatTimestamp()}] [INFO]`, ...args); writeLog('INFO', ...args); },
  warn: (...args) => { console.warn(`[${formatTimestamp()}] [WARN]`, ...args); writeLog('WARN', ...args); },
  error: (...args) => { console.error(`[${formatTimestamp()}] [ERROR]`, ...args); writeLog('ERROR', ...args); },
};

module.exports = logger;
