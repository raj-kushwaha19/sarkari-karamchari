const mongoose = require('mongoose');

const departmentEmailCacheSchema = new mongoose.Schema({
  regionPrefix: {
    type: String,
    required: true,
    index: true
  },
  pincode: {
    type: String,
    default: 'ALL', // 'ALL' means it applies to the whole state prefix
    index: true
  },
  category: {
    type: String,
    required: true,
    index: true,
    enum: ['electricity', 'water', 'roads', 'sanitation', 'police', 'streetlight', 'telecom', 'aadhaar', 'ration', 'foodsafety', 'traffic', 'general', 'forest', 'transport', 'fire', 'health']
  },
  departmentName: {
    type: String,
    required: true
  },
  officialEmail: {
    type: String,
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false // true if manually seeded by us, false if AI dynamically found it
  },
  source: {
    type: String,
    default: 'AI' // 'SEED' or 'AI'
  }
}, { timestamps: true });

// Compound index for super fast lookups
departmentEmailCacheSchema.index({ regionPrefix: 1, pincode: 1, category: 1 });

module.exports = mongoose.model('DepartmentEmailCache', departmentEmailCacheSchema);
