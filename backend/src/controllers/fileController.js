const EncryptedFile = require('../models/EncryptedFile');
const ActivityLog = require('../models/ActivityLog');
const cloudinary = require('../config/cloudinary');
const mongoose = require('mongoose');

// In-memory storage for testing mode (when DB is not connected)
let mockFiles = [];

const uploadFile = async (req, res) => {
  try {
    const { fileName, fileType, encryptedContent, iv, salt, mimeType, size } = req.body;
    
    if (!iv || !salt) {
      return res.status(400).json({ message: 'Missing encryption metadata' });
    }

    let fileUrl = '';

    if (fileType === 'file') {
      if (!req.file) {
        return res.status(400).json({ message: 'No file buffer received' });
      }

      try {
        console.log(`Uploading encrypted file to Cloudinary: ${fileName} (${req.file.size} bytes)`);
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { 
              resource_type: 'raw', // Always use 'raw' for encrypted data to avoid processing errors
              folder: 'ciphervault',
              public_id: `${Date.now()}-${fileName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`
            },
            (error, result) => {
  if (error) {
    console.error(
      'Cloudinary Upload Stream Error:',
      JSON.stringify(error, null, 2)
    );
    reject(error);
  } else {
    resolve(result);
  }
}
          );
          uploadStream.end(req.file.buffer);
        });
        fileUrl = result.secure_url;
        console.log('Cloudinary upload successful:', fileUrl);
      } catch (cloudinaryError) {
        console.error('Detailed Cloudinary error:', cloudinaryError);
        return res.status(500).json({ 
          message: 'Storage provider error', 
          error: cloudinaryError.message 
        });
      }
    }

    const fileData = {
      owner: req.user._id,
      fileName,
      originalName: fileName,
      fileType,
      fileUrl: fileType === 'file' ? fileUrl : undefined,
      encryptedContent: fileType === 'message' ? encryptedContent : undefined,
      mimeType,
      size: size ? Number(size) : undefined,
      iv,
      salt,
    };

    const newFile = await EncryptedFile.create(fileData);

    await ActivityLog.create({
      user: req.user._id,
      action: 'UPLOAD',
      details: `Uploaded ${fileType}: ${fileName}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json(newFile);
  } catch (error) {
    console.error('Upload error details:', error);
    res.status(500).json({ message: error.message || 'Server error during upload' });
  }
};

const getFiles = async (req, res) => {
  try {
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

    // If it's a file, delete from Cloudinary
    if (file.fileType === 'file' && file.fileUrl) {
      try {
        // Extract public_id from Cloudinary URL
        // Example URL: https://res.cloudinary.com/cloudname/raw/upload/v1234567/ciphervault/filename
        const urlParts = file.fileUrl.split('/');
        const fileNameWithExt = urlParts[urlParts.length - 1];
        const publicId = `ciphervault/${fileNameWithExt}`;
        
        console.log(`Attempting to delete Cloudinary asset: ${publicId}`);
        await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
      } catch (cloudinaryDeleteError) {
        console.error('Cloudinary deletion warning:', cloudinaryDeleteError);
        // We continue anyway to delete the record from our DB
      }
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
