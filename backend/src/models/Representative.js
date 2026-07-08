const mongoose = require('mongoose');

const representativeSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['MLA', 'MP', 'MLC', 'MAYOR'],
    required: true,
  },
  name: { type: String, default: 'Incumbent Representative' },
  party: { type: String, default: '' },
  state: { type: String, required: true },
  district: { type: String, required: true },
  constituency: { type: String, default: '' },
  email: { type: String, default: '' },
  officeEmail: { type: String, default: '' }, // Official office email
  phone: { type: String, default: '' },
  officePhone: { type: String, default: '' },
  address: { type: String, default: '' },
  pincode: { type: String, default: '' }, // PIN prefix for matching
  isVerified: { type: Boolean, default: false },
  source: { type: String, default: 'SEED' },
}, { timestamps: true });

// Index for fast lookup by state + district
representativeSchema.index({ state: 1, district: 1 });
representativeSchema.index({ pincode: 1 });

module.exports = mongoose.model('Representative', representativeSchema);
