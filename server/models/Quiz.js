const mongoose = require('mongoose')

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  options: [{
    type: String,
    required: true
  }],
  correctAnswer: {
    type: Number,
    required: true,
    min: 0,
    max: 3
  },
  explanation: String,
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  topic: String,
  subtopic: String
})

const quizResultSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  topic: {
    type: String,
    required: true
  },
  questions: [questionSchema],
  userAnswers: [{
    questionIndex: Number,
    selectedAnswer: Number,
    isCorrect: Boolean,
    timeSpent: Number
  }],
  score: {
    type: Number,
    required: true
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    required: true
  },
  timeSpent: {
    type: Number,
    default: 0
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  }
}, {
  timestamps: true
})

// Calculate percentage score
quizResultSchema.pre('save', function(next) {
  if (this.totalQuestions > 0) {
    this.percentage = Math.round((this.score / this.totalQuestions) * 100)
  }
  next()
})

// Index for efficient queries
quizResultSchema.index({ userId: 1, createdAt: -1 })
quizResultSchema.index({ topic: 1 })
quizResultSchema.index({ percentage: -1 })

module.exports = {
  QuizResult: mongoose.model('QuizResult', quizResultSchema),
  Question: mongoose.model('Question', questionSchema)
}