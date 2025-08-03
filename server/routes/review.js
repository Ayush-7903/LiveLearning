const express = require('express')
const router = express.Router()
const {
  getDueReviews,
  respondToReview,
  getReviewStats,
  addReviewItem,
  deleteReviewItem
} = require('../controllers/reviewController')

// Get items due for review
router.get('/due', getDueReviews)

// Respond to review item
router.post('/respond', respondToReview)

// Get review statistics
router.get('/stats', getReviewStats)

// Add new review item
router.post('/items', addReviewItem)

// Delete review item
router.delete('/items/:id', deleteReviewItem)

module.exports = router