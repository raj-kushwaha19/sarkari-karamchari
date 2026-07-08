const express = require('express');
const verifyJWT = require('../middleware/auth');
const Representative = require('../models/Representative');
const logger = require('../utils/logger');

const router = express.Router();

router.use(verifyJWT);

// GET /api/representatives?pinCode=XXXXXX
// Returns MLA + MP for the given pincode using prefix matching
router.get('/', async (req, res) => {
  try {
    const { pinCode } = req.query;
    if (!pinCode || pinCode.length !== 6) {
      return res.status(400).json({ error: 'Invalid PIN code. Must be 6 digits.' });
    }

    const pinStr = String(pinCode);
    const prefixes = [pinStr.substring(0, 4), pinStr.substring(0, 3), pinStr.substring(0, 2)];

    const results = [];
    const foundTypes = {};

    for (const prefix of prefixes) {
      const reps = await Representative.find({ pincode: prefix })
        .select('type name party state district constituency email officeEmail phone officePhone address pincode');

      for (const rep of reps) {
        // Only take the FIRST (most specific) match per type
        if (!foundTypes[rep.type]) {
          foundTypes[rep.type] = true;
          results.push(rep);
        }
      }

      // If we have both MLA and MP, stop searching
      if (foundTypes['MLA'] && foundTypes['MP']) break;
    }

    if (results.length === 0) {
      return res.json({ message: 'No representatives found for this pincode', data: [] });
    }

    res.json({ data: results });
  } catch (err) {
    logger.error('[Representatives] GET / error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// GET /api/representatives/state?state=Maharashtra
router.get('/state', async (req, res) => {
  try {
    const { state } = req.query;
    if (!state) return res.status(400).json({ error: 'State name is required.' });

    const reps = await Representative.find({ state: new RegExp(state, 'i') })
      .select('type name party state district constituency email officeEmail phone pincode')
      .sort({ type: 1, district: 1 });

    res.json({ total: reps.length, data: reps });
  } catch (err) {
    logger.error('[Representatives] GET /state error:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

module.exports = router;
