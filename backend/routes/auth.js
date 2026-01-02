const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');
const { authLimiter } = require('../middleware/limiter');

router.post('/login', authLimiter, authController.loginUser);
// router.post('/register', authController.registerUser); 

module.exports = router;