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
    
    const file = await EncryptedFile.findOne({ _id: fileId, owner: req.user._id });
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
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
