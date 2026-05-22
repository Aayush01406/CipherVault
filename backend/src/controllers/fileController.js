const EncryptedFile = require('../models/EncryptedFile');
const ActivityLog = require('../models/ActivityLog');
const cloudinary = require('../config/cloudinary');
const mongoose = require('mongoose');

// In-memory storage for testing mode (when DB is not connected)
let mockFiles = [];

const uploadFile = async (req, res) => {
  console.log('--- NEW UPLOAD REQUEST ---');
  console.log('Body:', { ...req.body, encryptedContent: req.body.encryptedContent ? '(truncated)' : undefined });
  console.log('File:', req.file ? { name: req.file.originalname, size: req.file.size } : 'No file');
  try {
    const { fileName, fileType, encryptedContent, iv, salt, mimeType, size } = req.body;
    console.log('Incoming upload request:', { fileName, fileType, iv, salt, hasFile: !!req.file });

    if (!iv || !salt) {
      console.error('Missing encryption metadata (IV or Salt) in request body');
    }

    if (mongoose.connection.readyState !== 1) {
      console.warn('Database not connected. Mocking successful upload for testing.');
      const mockFile = {
        _id: 'mock-file-id-' + Date.now(),
        owner: req.user._id,
        fileName,
        fileType,
        encryptedContent: fileType === 'file' && req.file ? req.file.buffer.toString('base64') : encryptedContent,
        fileUrl: fileType === 'file' && req.file ? `data:${mimeType};base64,${req.file.buffer.toString('base64')}` : undefined,
        iv: iv || 'MISSING_IV',
        salt: salt || 'MISSING_SALT',
        mimeType,
        size: parseInt(size || '0'),
        createdAt: new Date(),
      };
      console.log('Saved mock file with metadata:', { _id: mockFile._id, iv: mockFile.iv, salt: mockFile.salt, contentLen: mockFile.encryptedContent?.length });
      mockFiles.push(mockFile);
      return res.status(201).json(mockFile);
    }

    let fileUrl = '';

    if (fileType === 'file' && req.file) {
      // Cloudinary upload logic would go here if we're sending file directly
      // However, the requirement says encrypt on client side.
      // So we'll receive the encrypted blob/buffer.
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { resource_type: 'auto', folder: 'ciphervault' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });
      fileUrl = result.secure_url;
    }

    const newFile = await EncryptedFile.create({
      owner: req.user._id,
      fileName,
      fileType,
      fileUrl: fileType === 'file' ? fileUrl : undefined,
      encryptedContent: fileType === 'message' ? encryptedContent : undefined,
      mimeType,
      size,
      iv,
      salt,
    });

    await ActivityLog.create({
      user: req.user._id,
      action: 'UPLOAD',
      details: `Uploaded ${fileType}: ${fileName}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json(newFile);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Server error during upload' });
  }
};

const getFiles = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.warn('Database not connected. Returning mock files for testing.');
      return res.json(mockFiles.filter(f => f.owner === req.user._id));
    }
    const files = await EncryptedFile.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.json(files);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching files' });
  }
};

const deleteFile = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      mockFiles = mockFiles.filter(f => f._id !== req.params.id || f.owner !== req.user._id);
      return res.json({ message: 'Mock file deleted successfully' });
    }
    const file = await EncryptedFile.findOne({ _id: req.params.id, owner: req.user._id });
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // If it's a file, delete from Cloudinary (need to extract public_id)
    if (file.fileType === 'file' && file.fileUrl) {
      const publicId = file.fileUrl.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`ciphervault/${publicId}`);
    }

    await EncryptedFile.findByIdAndDelete(req.params.id);

    await ActivityLog.create({
      user: req.user._id,
      action: 'DELETE',
      details: `Deleted ${file.fileType}: ${file.fileName}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting file' });
  }
};

const clearMockVault = () => {
  mockFiles = [];
};

module.exports = { uploadFile, getFiles, deleteFile, clearMockVault };
