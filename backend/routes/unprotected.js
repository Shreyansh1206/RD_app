const express = require('express');
const router = express.Router();
const uniformController = require('../controllers/uniforms');
const schoolController = require('../controllers/schools');

// unprotected routes
router.get('/uniformCount', uniformController.uniformCount);

router.get('/schoolCount', schoolController.schoolCount);

module.exports = router;