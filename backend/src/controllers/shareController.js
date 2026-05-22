const ShareLink = require('../models/ShareLink');
const EncryptedFile = require('../models/EncryptedFile');
const ActivityLog = require('../models/ActivityLog');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const crypto = require('crypto');

// Mock data for testing mode
let mockShares = [];

const createShareLink = async (req, res) => {
  try {
    const { fileId, password, expiresAt, oneTimeDownload } = req.body;
    
    if (mongoose.connection.readyState !== 1) {
      const shareId = crypto.randomBytes(16).toString('hex');
      // We need to find the file from mockFiles in fileController
      // For simplicity in mock mode, we'll assume it exists if the ID starts with mock-
      const mockShare = {
        _id: 'mock-share-' + Date.now(),
        shareId,
        encryptedFile: fileId, // In mock mode this is just the ID string
        password, // Store plain password for mock verification
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        oneTimeDownload,
        downloadCount: 0,
        createdAt: new Date(),
      };
      mockShares.push(mockShare);
      return res.status(201).json(mockShare);
    }

    let passwordHash = undefined;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    const shareLink = await ShareLink.create({
      encryptedFile: fileId,
      passwordHash,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      oneTimeDownload,
    });

    await ActivityLog.create({
      user: req.user._id,
      action: 'SHARE',
      details: `Created share link for ${file.fileName}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json(shareLink);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating share link' });
  }
};

const getShareLinkData = async (req, res) => {
  try {
    const { shareId } = req.params;

    if (mongoose.connection.readyState !== 1) {
      const shareLink = mockShares.find(s => s.shareId === shareId);
      if (!shareLink) return res.status(404).json({ message: 'Share link not found' });
      
      // In mock mode, we need to return some file metadata too
      return res.json({
        ...shareLink,
        requiresPassword: !!shareLink.password,
        encryptedFile: {
          fileName: 'Secure Mock File.enc',
          fileType: 'file',
          mimeType: 'application/octet-stream',
          salt: '1234567890123456',
          iv: '123456789012'
        }
      });
    }

    const shareLink = await ShareLink.findOne({ shareId }).populate('encryptedFile');

    if (!shareLink) {
      return res.status(404).json({ message: 'Share link not found or expired' });
    }

    if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
      return res.status(410).json({ message: 'Share link has expired' });
    }

    if (shareLink.oneTimeDownload && shareLink.downloadCount > 0) {
      return res.status(410).json({ message: 'This link has already been used' });
    }

    // Return metadata only (no password hash)
    const { passwordHash, ...safeData } = shareLink.toObject();
    res.json({
      ...safeData,
      requiresPassword: !!passwordHash
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching share link' });
  }
};

const verifySharePassword = async (req, res) => {
  try {
    const { shareId, password } = req.body;

    if (mongoose.connection.readyState !== 1) {
      const shareLink = mockShares.find(s => s.shareId === shareId);
      if (!shareLink) return res.status(404).json({ message: 'Share link not found' });
      
      if (shareLink.password && shareLink.password !== password) {
        return res.status(401).json({ message: 'Incorrect password' });
      }

      return res.json({
        message: 'Verified',
        encryptedFile: {
          fileName: 'Secure Mock File.enc',
          fileType: 'file',
          mimeType: 'application/octet-stream',
          salt: '1234567890123456',
          iv: '123456789012',
          fileUrl: 'data:application/octet-stream;base64,dGVzdA==' // Mock content
        }
      });
    }

    const shareLink = await ShareLink.findOne({ shareId }).populate('encryptedFile');

    if (!shareLink) {
      return res.status(404).json({ message: 'Share link not found' });
    }

    if (shareLink.passwordHash) {
      const isMatch = await bcrypt.compare(password, shareLink.passwordHash);
      if (!isMatch) {
        // Log failed attempt
        await ActivityLog.create({
          user: shareLink.encryptedFile.owner,
          action: 'DECRYPT_FAILED',
          details: `Failed decryption attempt for ${shareLink.encryptedFile.fileName}`,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        });
        return res.status(401).json({ message: 'Incorrect password' });
      }
    }

    // Increment download count
    shareLink.downloadCount += 1;
    await shareLink.save();

    // Log success
    await ActivityLog.create({
      user: shareLink.encryptedFile.owner,
      action: 'DECRYPT_SUCCESS',
      details: `Successful decryption for ${shareLink.encryptedFile.fileName}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json(shareLink.encryptedFile);
  } catch (error) {
    res.status(500).json({ message: 'Server error verifying password' });
  }
};

module.exports = { createShareLink, getShareLinkData, verifySharePassword };
