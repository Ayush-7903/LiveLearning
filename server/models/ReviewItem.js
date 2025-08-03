const mongoose = require('mongoose')

const reviewItemSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  question: {
    type: String,
    required: true
  },
  answer: String,
  topic: {
    type: String,
    required: true
  },
  subtopic: String,
  difficulty: {
    type: Number,
    default: 2.5,
    min: 1.3,
    max: 5.0
  },
  interval: {
    type: Number,
    default: 1
  },
  repetitions: {
    type: Number,
    default: 0
  },
  nextReview: {
    type: Date,
    default: Date.now
  },
  lastReviewed: Date,
  reviewCount: {
    type: Number,
    default: 0
  },
  averageQuality: {
    type: Number,
    default: 0
  },
  source: {
    type: String,
    enum: ['quiz', 'manual', 'roadmap'],
    default: 'quiz'
  },
  sourceId: String
}, {
  timestamps: true
})

// SM-2 Spaced Repetition Algorithm
reviewItemSchema.methods.updateSpacedRepetition = function(quality) {
  // quality: 0-5 (0 = total blackout, 5 = perfect response)
  
  this.reviewCount++
  this.lastReviewed = new Date()
  
  // Update average quality
  this.averageQuality = ((this.averageQuality * (this.reviewCount - 1)) + quality) / this.reviewCount
  
  if (quality >= 3) {
    if (this.repetitions === 0) {
      this.interval = 1
    } else if (this.repetitions === 1) {
      this.interval = 6
    } else {
      this.interval = Math.round(this.interval * this.difficulty)
    }
    
    this.repetitions++
  } else {
    this.repetitions = 0
    this.interval = 1
  }
  
  // Update difficulty factor
  this.difficulty = this.difficulty + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  
  if (this.difficulty < 1.3) {
    this.difficulty = 1.3
  }
  
  // Set next review date
  this.nextReview = new Date(Date.now() + this.interval * 24 * 60 * 60 * 1000)
  
  return this
}

// Index for efficient queries
reviewItemSchema.index({ userId: 1, nextReview: 1 })
reviewItemSchema.index({ topic: 1 })
reviewItemSchema.index({ nextReview: 1 })

module.exports = mongoose.model('ReviewItem', reviewItemSchema)