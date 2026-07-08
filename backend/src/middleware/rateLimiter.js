const rateLimit = require('express-rate-limit');

const isDev = process.env.NODE_ENV !== 'production';

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 10000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests on this endpoint. Please wait before trying again.' },
});

module.exports = { globalLimiter, strictLimiter };
