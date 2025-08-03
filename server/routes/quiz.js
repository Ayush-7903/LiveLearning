const express = require('express')
const router = express.Router()
const {
  generateQuizQuestions,
  submitQuiz,
  getQuizResults,
  getQuizStats,
  explainWrongAnswer
} = require('../controllers/quizController')

// Generate quiz questions
router.get('/generate/:topic', generateQuizQuestions)

// Submit quiz answers
router.post('/submit', submitQuiz)

// Get quiz results
router.get('/results', getQuizResults)

// Get quiz statistics
router.get('/stats', getQuizStats)

// Get AI explanation for wrong answer
router.post('/explain', explainWrongAnswer)

module.exports = router