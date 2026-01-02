const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const { protect } = require('./middleware/authMiddleware');
const { apiLimiter } = require('./middleware/limiter');

// --- FAIL-FAST VALIDATION ---
const requiredEnv = ['MONGO_URI', 'JWT_SECRET', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
const missingEnv = requiredEnv.filter(key => !process.env[key]);

if (missingEnv.length > 0) {
  console.error('CRITICAL ERROR: Missing Environment Variables:', missingEnv.join(', '));
  process.exit(1); 
}

const app = express();

// Middleware
app.use(cors()); // Allows your React frontend to talk to this backend
app.use(express.json()); // Allows server to parse JSON in request body

// Apply Rate Limiting to all API routes
app.use('/api', apiLimiter);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch(err => console.log('MongoDB Connection Error:', err));

// Routes
const schoolsRouter = require('./routes/schools');
const uniformsRouter = require('./routes/uniforms');
const pricingRouter = require('./routes/pricing');
const basePricingRouter = require('./routes/basePricing');
const authRouter = require('./routes/auth');
const unprotectedRouter = require('./routes/unprotected');

app.use('/api/auth', authRouter);
app.use('/api/unprotected', unprotectedRouter);
app.use('/api/schools', protect, schoolsRouter);
app.use('/api/uniforms', protect, uniformsRouter);
app.use('/api/pricing', protect, pricingRouter);
app.use('/api/basePricing', protect, basePricingRouter);

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});