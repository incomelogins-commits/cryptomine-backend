const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const MiningStats = require('../models/MiningStats');

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ message: 'All fields are required' });

    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({ username, email, password });
    await MiningStats.create({ userId: user._id });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'mining_secret_key', { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user._id, username, email, wallet: user.wallet } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'mining_secret_key', { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, username: user.username, email, wallet: user.wallet, jackpotTriggered: user.jackpotTriggered } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
