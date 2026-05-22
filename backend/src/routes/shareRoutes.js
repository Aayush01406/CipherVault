const express = require('express');
const router = express.Router();
const { createShareLink, getShareLinkData, verifySharePassword } = require('../controllers/shareController');
const auth = require('../middleware/auth');

router.post('/create', auth, createShareLink);
router.get('/:shareId', getShareLinkData);
router.post('/verify', verifySharePassword);

module.exports = router;
