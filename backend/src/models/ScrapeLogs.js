const mongoose = require('mongoose');

const scrapeLogsSchema = new mongoose.Schema({
  source: { type: String, required: true },
  url: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  recordsFound: { type: Number, default: 0 },
  recordsChanged: { type: Number, default: 0 },
  status: { type: String, enum: ['success', 'error'], required: true },
  errorMessage: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('ScrapeLogs', scrapeLogsSchema);
