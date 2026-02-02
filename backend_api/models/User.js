const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // --- AUTH CREDENTIALS ---
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  
  // --- PROFILE DATA ---
  firstName: { type: String, default: '' },
  lastName:  { type: String, default: '' },
  phone:     { type: String, default: '' },
  street:    { type: String, default: '' },
  city:      { type: String, default: '' },
  country:   { type: String, default: 'Philippines' },
  profilePic:{ type: String, default: '' },
  bio:       { type: String, default: '' }, 
  role: { 
    type: String, 
    enum: ['user', 'admin', 'Member', 'Verified'], 
    default: 'user' 
  },

  // --- SOCIAL GRAPH ---
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  // --- SYSTEM FLAGS ---
  accountStatus: {
    type: String,
    enum: ['Active', 'Suspended', 'Pending'],
    default: 'Pending'
  },
  isVerified: {
    type: Boolean,
    default: false
  },

  // --- OTP LOGIC ---
  otpCode: { type: String, default: null },
  otpExpires: { type: Date, default: null },

}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);