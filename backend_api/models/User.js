const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    default: null 
  },
  provider: {
    type: String,
    enum: ['local', 'google.com', 'github.com'],
    default: 'local'
  },
  firebaseUid: {
    type: String, 
    default: null
  },

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

  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  accountStatus: {
    type: String,
    enum: ['Active', 'Inactive', 'Suspended', 'Pending'],
    default: 'Pending'
  },
   deactivationReason: {
    type: String,
    default: null
  },
  isVerified: {
    type: Boolean,
    default: false
  },
 
  otpCode: { type: String, default: null },
  otpExpires: { type: Date, default: null },

}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);