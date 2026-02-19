const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  aiThreshold: { type: Number, default: 85 },
  marketplaceEnabled: { type: Boolean, default: true },
  profanityFilter: { type: String, enum: ['Off', 'Moderate', 'Strict'], default: 'Strict' },
  chatbotPrompt: { 
    type: String, 
    default: 'You are CrayBot, an expert marine biologist specializing in Australian Red Claw Crayfish. Provide concise, helpful answers.' 
  },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Settings', settingsSchema);