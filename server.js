require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/mining', require('./routes/mining'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/support', require('./routes/support'));

// Health check
app.get('/', (req, res) => res.json({ status: 'Mining API running' }));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/miningapp')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

// Cron job: runs daily at midnight to check for jackpot eligibility
cron.schedule('0 0 * * *', async () => {
  console.log('Running daily jackpot check...');
  const { checkAndTriggerJackpots } = require('./utils/jackpot');
  await checkAndTriggerJackpots();
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
