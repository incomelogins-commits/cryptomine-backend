const mongoose = require('mongoose');

const miningStatsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  hashRate: { type: Number, default: 0 },       // MH/s
  uptime: { type: Number, default: 0 },          // hours
  coinsMined: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  lastSessionAt: { type: Date },
  sessionHistory: [{
    startedAt: Date,
    duration: Number,   // minutes
    hashRate: Number,
    coinsEarned: Number
  }]
}, { timestamps: true });

module.exports = mongoose.model('MiningStats', miningStatsSchema);
