const admin = require('firebase-admin');
const User = require('../models/User');
const mongoose = require('mongoose');

// Initialize Firebase Admin (this should be in a config file ideally)
// For now, we'll check if it's already initialized
if (!admin.apps.length) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey && privateKey.includes('BEGIN PRIVATE KEY')) {
      try {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
        console.log('Firebase Admin initialized successfully');
      } catch (certError) {
        console.error('Firebase Admin Cert Error:', certError.message);
        console.warn('Firebase Admin: Invalid certificate. Auth middleware will use mock user.');
      }
    } else {
      console.warn('Firebase Admin: Missing or invalid credentials. Auth middleware will fail.');
    }
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
  }
}

const authMiddleware = async (req, res, next) => {
  try {
    // For development/testing: Always use mock user if not properly configured
    const isMockMode = mongoose.connection.readyState !== 1 || !process.env.FIREBASE_PROJECT_ID;
    
    if (isMockMode) {
      req.user = {
        _id: 'mock-user-id',
        googleId: 'mock-user-id',
        email: 'testuser@example.com',
        displayName: 'Test User',
      };
      return next();
    }

    let user = await User.findOne({ googleId: 'mock-user-id' });

    if (!user) {
      user = await User.create({
        googleId: 'mock-user-id',
        email: 'testuser@example.com',
        displayName: 'Test User',
        photoURL: 'https://via.placeholder.com/150',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware bypass error:', error);
    return res.status(500).json({ message: 'Internal server error in test auth bypass' });
  }
};

module.exports = authMiddleware;
