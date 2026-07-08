const express = require('express');
const Complaint = require('../models/Complaint');
const logger = require('../utils/logger');

const router = express.Router();

// PUBLIC route - NO auth required
// GET /api/track/:code  → Returns read-only public view of a complaint
router.get('/:code', async (req, res) => {
  try {
    const code = (req.params.code || '').toUpperCase().trim();

    if (!code || code.length < 16) {
      return res.status(400).json({ error: 'Invalid complaint code format.' });
    }

    const complaint = await Complaint.findOne({ complaintCode: code })
      .select(
        'complaintCode department status escalationLevel location.pinCode ' +
        'description.raw createdAt lastUpdatedAt timeline mlaContact'
      );

    if (!complaint) {
      return res.status(404).json({ error: 'No complaint found with this code. Please check and try again.' });
    }

    // Return a sanitized PUBLIC view — no personal data (email, userRef etc.)
    res.json({
      complaintCode:   complaint.complaintCode,
      department:      complaint.department,
      status:          complaint.status,
      escalationLevel: complaint.escalationLevel,
      pinCode:         complaint.location?.pinCode,
      issue:           complaint.description?.raw,
      filedOn:         complaint.createdAt,
      lastUpdated:     complaint.lastUpdatedAt,
      currentStage:    getReadableStage(complaint.status, complaint.escalationLevel),
      timeline: (complaint.timeline || []).map(t => ({
        stage:     t.stage,
        note:      t.note,
        timestamp: t.timestamp,
      })),
      mlaContacted: complaint.escalationLevel >= 3 ? {
        type:     complaint.mlaContact?.type || 'MLA',
        district: complaint.mlaContact?.district || '',
      } : null,
    });

  } catch (err) {
    logger.error('[Track] GET /:code error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

function getReadableStage(status, escalationLevel) {
  if (status === 'resolved')        return 'Resolved ✅';
  if (status === 'rejected')        return 'Closed / Rejected';
  if (escalationLevel >= 3)         return '🚨 Final Escalation — Sent to MLA/Minister';
  if (status === 'hq_escalated')    return '⚠️ Escalated to Head of Department';
  if (escalationLevel >= 1)         return '📧 Follow-up Sent — Awaiting Department Response';
  if (status === 'department_received') return '📬 Email Dispatched to Department';
  return '📝 Complaint Filed — Under Review';
}

module.exports = router;
