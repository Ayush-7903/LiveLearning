const express = require('express')
const router = express.Router()
const {
  getProfile,
  updateProfile,
  getUserStats,
  updateUserStats
} = require('../controllers/profileController')

// Get user profile
router.get('/', getProfile)

// Update user profile
router.put('/', updateProfile)

// Get user statistics
router.get('/stats', getUserStats)

// Update user statistics
router.put('/stats', updateUserStats)

module.exports = router