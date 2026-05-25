const EncryptedFile = require('../models/EncryptedFile');
const ActivityLog = require('../models/ActivityLog');
const cloudinary = require('../config/cloudinary');
const mongoose = require('mongoose');

// In-memory storage for testing mode (when DB is not connected)
let mockFiles = [];

const uploadFile = async (req, res) => {
  try {
    const {
      fileName,
      fileType,
      encryptedContent,
      iv,
      salt,
      mimeType,
      size
    } = req.body;

    if (!iv || !salt) {
      return res.status(400).json({
        message: 'Missing encryption metadata'
      });
    }

    let fileUrl = '';

    if (fileType === 'file') {
      if (!req.file) {
        
        return res.status(400).json({
          message: 'No file buffer received'
        });
      }
      console.log("========== FILE DEBUG ==========");
console.log(req.file);
console.log("fieldname:", req.file.fieldname);
console.log("originalname:", req.file.originalname);
console.log("encoding:", req.file.encoding);
console.log("mimetype:", req.file.mimetype);
console.log("size:", req.file.size);
console.log(
  "buffer exists:",
  !!req.file.buffer
);
console.log(
  "buffer length:",
  req.file.buffer ? req.file.buffer.length : 0
);
console.log("================================");

      try {
        console.log(
          `Uploading encrypted file to Cloudinary: ${fileName} (${req.file.size} bytes)`
        );

        console.log('Mime type:', req.file.mimetype);

        const base64Data =
          `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

        const result = await cloudinary.uploader.upload(base64Data, {
          resource_type: 'auto',
          use_filename: true,
          unique_filename: true,
          overwrite: false
        });

        fileUrl = result.secure_url;

        console.log('Cloudinary upload successful');
        console.log('URL:', fileUrl);
      } catch (cloudinaryError) {
        console.error('===== CLOUDINARY ERROR =====');
        console.error(cloudinaryError);
        console.error('MESSAGE:', cloudinaryError.message);
        console.error('HTTP:', cloudinaryError.http_code);
        console.error(
          'FULL:',
          JSON.stringify(cloudinaryError, null, 2)
        );
        console.error('===========================');

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
      encryptedContent:
        fileType === 'message' ? encryptedContent : undefined,
      mimeType,
      size: size ? Number(size) : undefined,
      iv,
      salt
    };

    const newFile = await EncryptedFile.create(fileData);

    await ActivityLog.create({
      user: req.user._id,
      action: 'UPLOAD',
      details: `Uploaded ${fileType}: ${fileName}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(201).json(newFile);
  } catch (error) {
    console.error('Upload error details:', error);

    res.status(500).json({
      message: error.message || 'Server error during upload'
    });
  }
};

const getFiles = async (req, res) => {
  try {
    const files = await EncryptedFile.find({
      owner: req.user._id
    }).sort({ createdAt: -1 });

    res.json(files);
  } catch (error) {
    res.status(500).json({
      message: 'Server error fetching files'
    });
  }
};

const deleteFile = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      mockFiles = mockFiles.filter(
        f => f._id !== req.params.id || f.owner !== req.user._id
      );

      return res.json({
        message: 'Mock file deleted successfully'
      });
    }

    const file = await EncryptedFile.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!file) {
      return res.status(404).json({
        message: 'File not found'
      });
    }

    if (file.fileType === 'file' && file.fileUrl) {
      try {
        const urlParts = file.fileUrl.split('/');
        const fileNameWithExt =
          urlParts[urlParts.length - 1];

        await cloudinary.uploader.destroy(
          fileNameWithExt,
          {
            resource_type: 'auto'
          }
        );
      } catch (cloudinaryDeleteError) {
        console.error(
          'Cloudinary deletion warning:',
          cloudinaryDeleteError
        );
      }
    }

    await EncryptedFile.findByIdAndDelete(req.params.id);

    await ActivityLog.create({
      user: req.user._id,
      action: 'DELETE',
      details: `Deleted ${file.fileType}: ${file.fileName}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({
      message: 'File deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Server error deleting file'
    });
  }
};

const clearMockVault = () => {
  mockFiles = [];
};

module.exports = {
  uploadFile,
  getFiles,
  deleteFile,
  clearMockVault
};