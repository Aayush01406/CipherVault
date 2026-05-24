const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const cloudinary = require('./config/cloudinary');

const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();
app.set('trust proxy', 1);

// Database Connection Logic
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ciphervault';
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Database connection error:', err.message);
  }
};

app.get('/cloudinary-raw-test', async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(
      'data:text/plain;base64,SGVsbG8gQ2xvdWRpbmFyeQ==',
      {
        resource_type: 'raw'
      }
    );

    res.json(result);
  } catch (err) {
    console.error('RAW TEST FAILED:', err);

    res.status(500).json(err);
  }
});

// Middleware
app.use(async (req, res, next) => {
  await connectDB();
  next();
});
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(helmet());
app.use(morgan('dev'));
app.use('/api/', apiLimiter);

// Routes
app.use('/api/files', require('./routes/fileRoutes'));
app.use('/api/share', require('./routes/shareRoutes'));

app.get('/', (req, res) => {
  res.json({ status: 'healthy', message: 'Welcome to CipherVault API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('--- GLOBAL ERROR HANDLER ---');
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// For local development
const PORT = process.env.PORT || 5000;

(async () => {
  try {
    const result = await cloudinary.api.ping();
    console.log('CLOUDINARY PING SUCCESS:', result);
  } catch (err) {
    console.error('CLOUDINARY PING FAILED:', err);
  }
})();

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect DB:", err);
    process.exit(1);
  });

module.exports = app;
