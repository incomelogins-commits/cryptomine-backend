const router = require('express').Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const SupportRequest = require('../models/SupportRequest');

// Withdraw
router.post('/withdraw', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    const user = await User.findById(req.userId);

    if (!amount || amount <= 0)
      return res.status(400).json({ message: 'Invalid withdrawal amount' });

    if (amount > user.wallet.balance)
      return res.status(400).json({ message: 'Insufficient balance' });

    // Check if this is a jackpot withdrawal
    if (user.jackpotTriggered && user.wallet.jackpotWinnings > 0 && amount >= user.wallet.jackpotWinnings * 0.5) {
      // Log support request
      await SupportRequest.create({
        userId: req.userId,
        type: 'jackpot_withdrawal',
        method: 'livechat',
        amount,
        status: 'open',
        notes: `User requested jackpot withdrawal of $${amount}`
      });

      await Transaction.create({
        userId: req.userId,
        type: 'withdrawal',
        amount,
        status: 'requires_support',
        description: 'Jackpot withdrawal - pending support review'
      });

      return res.status(200).json({
        requiresSupport: true,
        message: "🎉 Congratulations! You've hit the jackpot. Please contact support to process your withdrawal.",
        openChat: true
      });
    }

    // Normal withdrawal (non-jackpot)
    await User.findByIdAndUpdate(req.userId, {
      $inc: { 'wallet.balance': -amount }
    });

    await Transaction.create({
      userId: req.userId,
      type: 'withdrawal',
      amount,
      status: 'pending',
      description: `Withdrawal request of $${amount}`
    });

    res.json({ message: 'Withdrawal request submitted successfully', amount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Connect wallet address
router.post('/connect', auth, async (req, res) => {
  try {
    const { address } = req.body;
    if (!address) return res.status(400).json({ message: 'Wallet address required' });

    await User.findByIdAndUpdate(req.userId, { 'wallet.address': address });
    res.json({ message: 'Wallet connected successfully', address });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
