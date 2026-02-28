const mongoose = require('mongoose');

const supportRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, default: 'jackpot_withdrawal' },
  method: { type: String, default: 'livechat' },
  amount: { type: Number },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved'],
    default: 'open'
  },
  notes: { type: String },
  resolvedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('SupportRequest', supportRequestSchema);
