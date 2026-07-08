const express = require('express');
const verifyJWT = require('../middleware/auth');
const adminGuard = require('../middleware/adminGuard');
const DepartmentDirectory = require('../models/DepartmentDirectory');
const Representative = require('../models/Representative');
const ScrapeLogs = require('../models/ScrapeLogs');
const Complaint = require('../models/Complaint');
const logger = require('../utils/logger');

const router = express.Router();

// All admin routes require auth + admin role
router.use(verifyJWT, adminGuard);

// GET /api/admin/review-queue
router.get('/review-queue', async (req, res) => {
  try {
    const pendingDepts = await DepartmentDirectory.find({ approvalStatus: 'pending' }).select('-__v');
    const pendingReps = await Representative.find({ approvalStatus: 'pending' }).select('-__v');

    const queue = [
      ...pendingDepts.map(d => ({ ...d.toObject(), recordType: 'DepartmentDirectory' })),
      ...pendingReps.map(r => ({ ...r.toObject(), recordType: 'Representative' })),
    ].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    res.json({ count: queue.length, records: queue });
  } catch (err) {
    logger.error('[Admin] GET /review-queue error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// PATCH /api/admin/review-queue/:id/approve
router.patch('/review-queue/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { recordType } = req.body;

    let record;
    if (recordType === 'DepartmentDirectory') {
      record = await DepartmentDirectory.findByIdAndUpdate(id, { approvalStatus: 'approved' }, { new: true });
    } else if (recordType === 'Representative') {
      record = await Representative.findByIdAndUpdate(id, { approvalStatus: 'approved' }, { new: true });
    } else {
      // Try both
      record = await DepartmentDirectory.findByIdAndUpdate(id, { approvalStatus: 'approved' }, { new: true })
        || await Representative.findByIdAndUpdate(id, { approvalStatus: 'approved' }, { new: true });
    }

    if (!record) return res.status(404).json({ error: 'Record not found.' });
    logger.info(`[Admin] Record approved: ${id} by ${req.user.email}`);
    res.json({ message: 'Record approved.', record });
  } catch (err) {
    logger.error('[Admin] PATCH /approve error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// PATCH /api/admin/review-queue/:id/reject
router.patch('/review-queue/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { recordType } = req.body;

    let record;
    if (recordType === 'DepartmentDirectory') {
      record = await DepartmentDirectory.findByIdAndUpdate(id, { approvalStatus: 'rejected' }, { new: true });
    } else if (recordType === 'Representative') {
      record = await Representative.findByIdAndUpdate(id, { approvalStatus: 'rejected' }, { new: true });
    } else {
      record = await DepartmentDirectory.findByIdAndUpdate(id, { approvalStatus: 'rejected' }, { new: true })
        || await Representative.findByIdAndUpdate(id, { approvalStatus: 'rejected' }, { new: true });
    }

    if (!record) return res.status(404).json({ error: 'Record not found.' });
    logger.info(`[Admin] Record rejected: ${id} by ${req.user.email}`);
    res.json({ message: 'Record rejected.', record });
  } catch (err) {
    logger.error('[Admin] PATCH /reject error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// GET /api/admin/scrape-logs
router.get('/scrape-logs', async (req, res) => {
  try {
    const logs = await ScrapeLogs.find().sort({ timestamp: -1 }).limit(50).select('-__v');
    res.json(logs);
  } catch (err) {
    logger.error('[Admin] GET /scrape-logs error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// GET /api/admin/complaints
router.get('/complaints', async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate('userRef', 'name email')
      .sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) {
    logger.error('[Admin] GET /complaints error:', err);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

module.exports = router;
