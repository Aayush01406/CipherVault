const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadFile, getFiles, deleteFile } = require('../controllers/fileController');
const auth = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimiter');

const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

router.post('/upload', auth, uploadLimiter, upload.single('file'), uploadFile);
router.get('/', auth, getFiles);
router.delete('/clear', auth, (req, res) => {
  const { clearMockVault } = require('../controllers/fileController');
  if (clearMockVault) {
    clearMockVault();
    res.json({ message: 'Mock vault cleared' });
  } else {
    res.status(400).json({ message: 'Clear vault only available in testing mode' });
  }
});
router.delete('/:id', auth, deleteFile);

module.exports = router;
