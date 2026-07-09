const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const verifyJWT = require('../middleware/auth');
const User = require('../models/User');
const logger = require('../utils/logger');

const router = express.Router();

// Redirect to Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/?error=auth_failed` }),
  (req, res) => {
    try {
      const payload = { id: req.user._id, email: req.user.email, role: req.user.role };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

      const isProd = process.env.NODE_ENV === 'production';

      // Set cookie (works for same-domain; cross-domain fallback via URL token)
      res.cookie('token', token, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax', // 'none' required for cross-domain (Render→Vercel)
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      logger.info(`[Auth] User logged in: ${req.user.email}`);
      // Pass token in URL so frontend can store it (cross-domain cookie may be blocked)
      res.redirect(`${process.env.FRONTEND_URL}/dashboard?token=${token}`);
    } catch (err) {
      logger.error('[Auth] JWT generation failed:', err);
      res.redirect(`${process.env.FRONTEND_URL}/?error=server_error`);
    }
  }
);


// Get current user
router.get('/me', verifyJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-__v');
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ 
      id: user._id, 
      name: user.name, 
      email: user.email, 
      role: user.role,
      onboarded: user.onboarded,
      language: user.language,
      addresses: user.addresses
    });
  } catch (err) {
    logger.error('[Auth] /me error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});


// Complete Onboarding
router.put('/onboarding', verifyJWT, async (req, res) => {
  try {
    const { address, pincode, language, name } = req.body; // Expecting single address for onboarding
    if (!address || !pincode || !language) {
      return res.status(400).json({ error: 'Address, pincode, and language are required.' });
    }
    
    const updateData = { language, onboarded: true };
    if (name) updateData.name = name;

    const user = await User.findById(req.user.id);
    if (user.addresses.length === 0) {
      user.addresses.push({ tag: 'Home', fullAddress: address, pincode: pincode, isDefault: true });
    }
    
    user.language = language;
    user.onboarded = true;
    if (name) user.name = name;
    
    await user.save();
    res.json({ message: 'Onboarding complete', user });
  } catch (err) {
    logger.error('[Auth] /onboarding error:', err);
    res.status(500).json({ error: 'Failed to complete onboarding.' });
  }
});

// ─────────────────────────────────────────────────────────
// ADDRESS MANAGEMENT ROUTES
// ─────────────────────────────────────────────────────────

// Add a new address
router.post('/addresses', verifyJWT, async (req, res) => {
  try {
    const { tag, fullAddress, pincode, isDefault } = req.body;
    if (!fullAddress || !pincode) return res.status(400).json({ error: 'Address and Pincode required.' });

    const user = await User.findById(req.user.id);
    
    // If making this default, unset others
    if (isDefault || user.addresses.length === 0) {
      user.addresses.forEach(a => a.isDefault = false);
    }
    
    user.addresses.push({ tag: tag || 'Home', fullAddress, pincode, isDefault: isDefault || user.addresses.length === 0 });
    await user.save();
    
    res.json({ message: 'Address added', addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add address.' });
  }
});

// Update an address
router.put('/addresses/:addressId', verifyJWT, async (req, res) => {
  try {
    const { tag, fullAddress, pincode, isDefault } = req.body;
    const user = await User.findById(req.user.id);
    const address = user.addresses.id(req.params.addressId);
    
    if (!address) return res.status(404).json({ error: 'Address not found' });
    
    if (isDefault) {
      user.addresses.forEach(a => a.isDefault = false);
    }
    
    if (tag) address.tag = tag;
    if (fullAddress) address.fullAddress = fullAddress;
    if (pincode) address.pincode = pincode;
    if (typeof isDefault !== 'undefined') address.isDefault = isDefault;
    
    await user.save();
    res.json({ message: 'Address updated', addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update address.' });
  }
});

// Delete an address
router.delete('/addresses/:addressId', verifyJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.addresses.pull({ _id: req.params.addressId });
    
    // If deleted the default, make the first one default
    if (user.addresses.length > 0 && !user.addresses.some(a => a.isDefault)) {
      user.addresses[0].isDefault = true;
    }
    
    await user.save();
    res.json({ message: 'Address deleted', addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete address.' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  res.json({ message: 'Logged out successfully.' });
});

module.exports = router;
