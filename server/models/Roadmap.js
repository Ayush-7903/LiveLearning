const mongoose = require('mongoose')

const stepSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  resources: [String],
  estimatedTime: String,
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: Date,
  order: {
    type: Number,
    required: true
  }
})

const roadmapSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
  },
  steps: [stepSchema],
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused'],
    default: 'active'
  },
  estimatedDuration: String,
  tags: [String]
}, {
  timestamps: true
})

// Calculate progress based on completed steps
roadmapSchema.methods.calculateProgress = function() {
  if (this.steps.length === 0) return 0
  
  const completedSteps = this.steps.filter(step => step.completed).length
  const progress = Math.round((completedSteps / this.steps.length) * 100)
  
  this.progress = progress
  
  if (progress === 100) {
    this.status = 'completed'
  }
  
  return progress
}

// Index for efficient queries
roadmapSchema.index({ userId: 1, createdAt: -1 })
roadmapSchema.index({ topic: 1 })
roadmapSchema.index({ level: 1 })

module.exports = mongoose.model('Roadmap', roadmapSchema)