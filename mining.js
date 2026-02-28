const router = require('express').Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const MiningStats = require('../models/MiningStats');
const Transaction = require('../models/Transaction');
const { triggerJackpot } = require('../utils/jackpot');

// Get mining stats
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await MiningStats.findOne({ userId: req.userId });
    const user = await User.findById(req.userId).select('-password');
    res.json({ stats, wallet: user.wallet, jackpotTriggered: user.jackpotTriggered });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Start/record a mining session
router.post('/session', auth, async (req, res) => {
  try {
    const { duration = 60, hashRate = Math.floor(Math.random() * 500 + 100) } = req.body;
    const coinsEarned = parseFloat((hashRate * duration * 0.000001).toFixed(6));
    const earnings = parseFloat((coinsEarned * 45000).toFixed(2)); // assume $45k/BTC equiv

    const user = await User.findById(req.userId);
    if (!user.firstMiningDate) {
      await User.findByIdAndUpdate(req.userId, { firstMiningDate: new Date() });
    }

    const stats = await MiningStats.findOneAndUpdate(
      { userId: req.userId },
      {
        $inc: { coinsMined: coinsEarned, totalEarnings: earnings, uptime: duration / 60 },
        $set: { hashRate, lastSessionAt: new Date() },
        $push: {
          sessionHistory: {
            startedAt: new Date(),
            duration,
            hashRate,
            coinsEarned
          }
        }
      },
      { new: true }
    );

    await User.findByIdAndUpdate(req.userId, {
      $inc: { 'wallet.balance': earnings, miningSessionCount: 1 }
    });

    await Transaction.create({
      userId: req.userId,
      type: 'mining',
      amount: earnings,
      status: 'completed',
      description: `Mining session: ${coinsEarned} coins at ${hashRate} MH/s`
    });

    const updatedUser = await User.findById(req.userId).select('-password');
    res.json({ stats, wallet: updatedUser.wallet, sessionEarnings: earnings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Manually trigger jackpot (admin/test endpoint)
router.post('/jackpot/trigger', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.jackpotTriggered) {
      return res.status(400).json({ message: 'Jackpot already triggered for this user' });
    }
    if (user.miningSessionCount < 5) {
      return res.status(400).json({ message: 'Minimum 5 mining sessions required' });
    }

    const amount = await triggerJackpot(req.userId);
    const updatedUser = await User.findById(req.userId).select('-password');
    res.json({
      message: `🎰 JACKPOT! You won $${amount.toLocaleString()}!`,
      amount,
      wallet: updatedUser.wallet
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get transactions
router.get('/transactions', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(20);
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
