const User = require('../models/User');
const Transaction = require('../models/Transaction');

const MIN_JACKPOT = 30000;
const MAX_JACKPOT = 500000;

function generateJackpotAmount(miningStats) {
  // Base randomization weighted by mining performance
  const base = MIN_JACKPOT + Math.random() * (MAX_JACKPOT - MIN_JACKPOT);
  // Slight multiplier based on hash rate (more active miners can win more)
  const multiplier = miningStats ? Math.min(1.5, 1 + (miningStats.hashRate / 1000) * 0.1) : 1;
  return Math.floor(base * multiplier);
}

async function checkAndTriggerJackpots() {
  try {
    const now = new Date();
    // Find users who have 5+ sessions, no jackpot yet, first mined 4-7 days ago
    const users = await User.find({
      jackpotTriggered: false,
      miningSessionCount: { $gte: 5 },
      firstMiningDate: {
        $gte: new Date(now - 7 * 24 * 60 * 60 * 1000),
        $lte: new Date(now - 4 * 24 * 60 * 60 * 1000)
      }
    });

    for (const user of users) {
      // Random chance each day (roughly ensures it fires between day 4-7)
      if (Math.random() < 0.4) {
        await triggerJackpot(user._id);
        console.log(`Jackpot triggered for user ${user._id}`);
      }
    }
  } catch (err) {
    console.error('Jackpot cron error:', err);
  }
}

async function triggerJackpot(userId) {
  const MiningStats = require('../models/MiningStats');
  const stats = await MiningStats.findOne({ userId });
  const amount = generateJackpotAmount(stats);

  await User.findByIdAndUpdate(userId, {
    $inc: { 'wallet.balance': amount, 'wallet.jackpotWinnings': amount },
    jackpotTriggered: true,
    jackpotTriggeredAt: new Date()
  });

  await Transaction.create({
    userId,
    type: 'jackpot',
    amount,
    status: 'completed',
    description: `🎰 Jackpot win of $${amount.toLocaleString()}`,
    metadata: { triggeredAt: new Date() }
  });

  return amount;
}

module.exports = { generateJackpotAmount, checkAndTriggerJackpots, triggerJackpot };
