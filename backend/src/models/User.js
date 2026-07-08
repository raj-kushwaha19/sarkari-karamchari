const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  addresses: [{
    tag: { type: String, enum: ['Home', 'Office', 'Other'], default: 'Home' },
    fullAddress: { type: String, required: true },
    pincode: { type: String, required: true },
    isDefault: { type: Boolean, default: false }
  }],
  language: { type: String, enum: ['English', 'Hindi', 'Hinglish'], default: 'English' },
  onboarded: { type: Boolean, default: false },
  gmailRefreshToken: { type: String, default: null, select: false },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
