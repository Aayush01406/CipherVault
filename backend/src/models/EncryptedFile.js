const mongoose = require('mongoose');

const encryptedFileSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  fileType: {
    type: String, // 'file' or 'message'
    required: true,
  },
  fileUrl: {
    type: String, // Cloudinary or S3 URL
    required: function() { return this.fileType === 'file'; }
  },
  encryptedContent: {
    type: String, // Only for 'message' type
    required: function() { return this.fileType === 'message'; }
  },
  mimeType: {
    type: String,
  },
  size: {
    type: Number,
  },
  iv: {
    type: String, // Initialization vector used for encryption
    required: true,
  },
  salt: {
    type: String, // Salt used for PBKDF2
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('EncryptedFile', encryptedFileSchema);
