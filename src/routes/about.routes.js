const express = require('express');
const router = express.Router();
const aboutController = require('../controllers/about.controller');
const authMiddleware = require('../middleware/authMiddleware');

// router.use(authMiddleware);
router.get('/content', aboutController.getContent);
router.put('/content', aboutController.updateContent);

module.exports = router;