const express = require('express');
const verifyJWT = require('../middleware/auth');
const { strictLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// These handlers are implemented by the AI Engine module
// See src/services/aiService.js, whisperService.js, ocrService.js

const { classifyComplaint } = require('../services/aiService');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.post('/classify', verifyJWT, strictLimiter, upload.single('image'), async (req, res) => {
  try {
    const { text, pinCode, selectedAddress } = req.body;
    if (!text && !req.file) return res.status(400).json({ error: 'Please provide text or photo' });
    
    // Fetch full user details to inject into email
    const User = require('../models/User');
    const user = await User.findById(req.user.id);

    // Wire up to our fallback AI service
    const result = await classifyComplaint(text || 'Complaint from photo', pinCode, user, selectedAddress);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message || 'AI service failed' });
  }
});

router.post('/transcribe', verifyJWT, strictLimiter, (req, res) => {
  res.status(501).json({ error: 'Transcription service module loading. Please try again shortly.' });
});

module.exports = router;
