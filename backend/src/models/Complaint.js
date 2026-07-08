const mongoose = require('mongoose');
const crypto = require('crypto');

// Generate a unique 16-char alphanumeric code like: A3X9-K2MQ-T7PL-W4NR
const generateComplaintCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0,O,1,I to avoid confusion
  let code = '';
  const bytes = crypto.randomBytes(16);
  for (let i = 0; i < 16; i++) {
    code += chars[bytes[i] % chars.length];
    if (i === 3 || i === 7 || i === 11) code += '-';
  }
  return code;
};

const timelineEntrySchema = new mongoose.Schema({
  stage: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  note: { type: String, default: '' },
}, { _id: false });

const notificationSchema = new mongoose.Schema({
  message: { type: String, required: true },
  type: { type: String, enum: ['info', 'warning', 'success', 'danger'], default: 'info' },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const complaintSchema = new mongoose.Schema({
  complaintCode: { type: String, unique: true, index: true },
  userRef: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  department: { type: String, required: true },
  officialEmail: { type: String, default: '' }, // Department email (Level 1)
  location: {
    pinCode: { type: String, required: true, match: /^\d{6}$/ },
    exactAddress: { type: String, default: '' },
  },
  status: {
    type: String,
    enum: ['submitted', 'department_received', 'hq_escalated', 'resolved', 'rejected'],
    default: 'submitted',
  },
  description: {
    raw: { type: String, required: true },
    aiFormatted: { type: String, default: '' },
  },
  timeline: [timelineEntrySchema],
  notifications: [notificationSchema],
  lastUpdatedAt: { type: Date, default: Date.now },
  escalationLevel: { type: Number, default: 0, min: 0, max: 3 },
  followUpSentAt: { type: Date, default: null },    // When level-1 followup sent
  escalatedAt: { type: Date, default: null },        // When escalated to MLA
  userActionRequired: { 
    type: String, 
    enum: ['none', 'needs_followup', 'needs_escalation'], 
    default: 'none' 
  },
  nextCheckDate: { type: Date, default: Date.now },
  mlaContact: {
    name:     { type: String, default: '' },
    type:     { type: String, default: '' }, // MLA / MP
    district: { type: String, default: '' },
    email:    { type: String, default: '' },
    phone:    { type: String, default: '' },
  },
}, { timestamps: true });

// Auto-generate complaintCode before first save
complaintSchema.pre('save', function(next) {
  if (!this.complaintCode) {
    this.complaintCode = generateComplaintCode();
  }
  if (typeof next === 'function') {
    next();
  }
});

module.exports = mongoose.model('Complaint', complaintSchema);
