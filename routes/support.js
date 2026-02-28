const router = require('express').Router();
const auth = require('../middleware/auth');
const SupportRequest = require('../models/SupportRequest');

// Log a support request
router.post('/request', auth, async (req, res) => {
  try {
    const { type = 'general', method = 'livechat', amount, notes } = req.body;

    const request = await SupportRequest.create({
      userId: req.userId,
      type,
      method,
      amount,
      status: 'open',
      notes
    });

    res.status(201).json({ message: 'Support request logged', requestId: request._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user's support requests
router.get('/requests', auth, async (req, res) => {
  try {
    const requests = await SupportRequest.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
