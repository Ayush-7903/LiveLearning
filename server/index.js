const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
require('dotenv').config()

const connectDB = require('./config/database')
const authMiddleware = require('./middleware/auth')

// Import routes
const authRoutes = require('./routes/auth')
const roadmapRoutes = require('./routes/roadmaps')
const quizRoutes = require('./routes/quiz')
const profileRoutes = require('./routes/profile')
const reviewRoutes = require('./routes/review')

const app = express()
const PORT = process.env.PORT || 5000

// Connect to MongoDB
connectDB()

// Security middleware
// app.use(helmet())
const allowedOrigins = [
  'http://localhost:3000',
 
  'https://live-learning.vercel.app'
  
  'https://live-learning-9bmk0re72-ayush-7903s-projects.vercel.app'
  
  
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));


// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
})
app.use(limiter)

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/roadmaps', authMiddleware, roadmapRoutes)
app.use('/api/quiz', authMiddleware, quizRoutes)
app.use('/api/profile', authMiddleware, profileRoutes)
app.use('/api/review', authMiddleware, reviewRoutes)

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack)
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => e.message)
    })
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    })
  }
  
  res.status(500).json({
    success: false,
    message: 'Internal Server Error'
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📚 Live Learning Assistant API`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
})

module.exports = app