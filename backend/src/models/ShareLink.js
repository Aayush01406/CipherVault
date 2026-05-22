const mongoose = require('mongoose');
const crypto = require('crypto');

const shareLinkSchema = new mongoose.Schema({
  encryptedFile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EncryptedFile',
    required: true,
  },
  shareId: {
    type: String,
    unique: true,
    default: () => crypto.randomBytes(16).toString('hex'),
  },
  passwordHash: {
    type: String, // Optional: if the owner wants a specific password for this link
  },
  expiresAt: {
    type: Date,
  },
  oneTimeDownload: {
    type: Boolean,
    default: false,
  },
  downloadCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('ShareLink', shareLinkSchema);
