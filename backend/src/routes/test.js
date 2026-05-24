const express = require('express');
const router = express.Router();
const cloudinary = require('../config/cloudinary');

router.get('/cloudinary-test', async (req, res) => {
  try {
    const result = await cloudinary.api.ping();
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});

module.exports = router;