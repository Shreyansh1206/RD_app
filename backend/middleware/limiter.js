const rateLimit = require('express-rate-limit');

// General Limiter (e.g., for standard API routes)
// 100 requests per 15 minutes
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 690,
    standardHeaders: true, 
    legacyHeaders: false,
    message: { message: 'Too many requests, please try again later.' }
});

// Stricter Limiter (e.g., for Login/Register)
// 5 attempts per 15 minutes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, 
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many login attempts, please try again after 15 minutes.' }
});

module.exports = { apiLimiter, authLimiter };
