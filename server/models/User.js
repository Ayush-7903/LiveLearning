const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  profile: {
    learningStyle: [{
      type: String,
      enum: ['Visual', 'Auditory', 'Hands-on', 'Reading/Writing', 'Fast Learner', 'Step-by-step']
    }],
    preferredTopics: [String],
    studyGoals: String,
    skillLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    }
  },
  stats: {
    totalQuizzes: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    },
    totalStudyTime: {
      type: Number,
      default: 0
    },
    streak: {
      type: Number,
      default: 0
    },
    lastActive: Date
  }
}, {
  timestamps: true
})

// Index for efficient queries
userSchema.index({ firebaseUid: 1 })
userSchema.index({ email: 1 })

// Update last active timestamp
userSchema.methods.updateLastActive = function() {
  this.stats.lastActive = new Date()
  return this.save()
}

module.exports = mongoose.model('User', userSchema)