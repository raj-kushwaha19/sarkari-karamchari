const mongoose = require('mongoose');

const departmentDirectorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  jurisdiction: { type: String, default: '' },
  officialEmail: { type: String, default: '' },
  contactInfo: { type: String, default: '' },
  lastVerifiedAt: { type: Date, default: Date.now },
  sourceUrl: { type: String, default: '' },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
}, { timestamps: true });

module.exports = mongoose.model('DepartmentDirectory', departmentDirectorySchema);
