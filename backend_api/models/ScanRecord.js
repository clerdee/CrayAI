const mongoose = require('mongoose');

const scanRecordSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  scanId: { type: String, required: true },

  image: {
    url: { type: String, required: true },
    public_id: { type: String, required: true }
  },

  morphometrics: {
    width_cm: { type: Number, default: 0 },
    height_cm: { type: Number, default: 0 },
    estimated_age: { type: String }
  },
  
  environment: {
    algae_label: { type: String },
    turbidity_level: { type: Number, default: 1 }
  },
  
  location: { type: String, default: 'Unknown Location' },
  processing_time: { type: String },
  model_version: { type: String },
  isPublic: { type: Boolean, default: false },
  isFavorite: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false }

}, { timestamps: true });

module.exports = mongoose.model('ScanRecord', scanRecordSchema);