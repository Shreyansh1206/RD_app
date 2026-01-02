const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const { protect } = require('./middleware/authMiddleware');
const { apiLimiter } = require('./middleware/limiter');
const connectDB = require('./config/db');

// --- FAIL-FAST VALIDATION ---
const requiredEnv = ['MONGO_URI', 'JWT_SECRET', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
const missingEnv = requiredEnv.filter(key => !process.env[key]);

if (missingEnv.length > 0) {
  console.error('CRITICAL ERROR: Missing Environment Variables:', missingEnv.join(', '));
  process.exit(1); 
}

const app = express();
app.set('trust proxy', 1); // CRITICAL for Vercel: Trust the proxy to get correct IP

// Middleware
app.use(cors({
    origin: [
        "http://localhost:5173",                 // Localhost (for development)
        "https://rastogidresses.vercel.app"     // Your LIVE Frontend URL
    ],
    methods: ["POST", "GET", "PUT", "DELETE", "PATCH"], // Allow these methods
    credentials: true // Allow cookies/sessions
})); // Allows your React frontend to talk to this backend

app.use(express.json()); // Allows server to parse JSON in request body

// Apply Rate Limiting to all API routes
app.use('/api', apiLimiter);

// Connect to MongoDB (Optimized for Serverless)
// Check if we are already connected before trying to connect again
if (mongoose.connection.readyState === 0) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected Successfully'))
    .catch(err => console.log('MongoDB Connection Error:', err));
}

// Routes
const schoolsRouter = require('./routes/schools');
const uniformsRouter = require('./routes/uniforms');
const pricingRouter = require('./routes/pricing');
const basePricingRouter = require('./routes/basePricing');
const authRouter = require('./routes/auth');
const unprotectedRouter = require('./routes/unprotected');

app.get('/', (req, res) => {
    res.send("API is Running");
});

app.use(async (req, res, next) => {
    try {
        await connectDB(); // Ensure DB is connected before ANY route is hit
        next();
    } catch (error) {
        console.error("Database connection failed:", error);
        res.status(500).json({ error: "Database connection failed" });
    }
});

app.use('/api/auth', authRouter);
app.use('/api/unprotected', unprotectedRouter);
app.use('/api/schools', protect, schoolsRouter);
app.use('/api/uniforms', protect, uniformsRouter);
app.use('/api/pricing', protect, pricingRouter);
app.use('/api/basePricing', protect, basePricingRouter);

// Start Server
const PORT = process.env.PORT || 5000;
// Only run locally if NOT in Vercel production
if (process.env.NODE_ENV && process.env.NODE_ENV.trim() !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// CRITICAL for Vercel: Export the app so Vercel can run it as a Serverless Function
module.exports = app;