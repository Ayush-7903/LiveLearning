const { QuizResult } = require('../models/Quiz')
const ReviewItem = require('../models/ReviewItem')
const User = require('../models/User')
const { generateQuiz, explainAnswer } = require('../utils/openai')

const generateQuizQuestions = async (req, res) => {
  try {
    const { topic } = req.params
    const { difficulty = 'medium', count = 5 } = req.query
    const userId = req.user.uid

    if (!topic) {
      return res.status(400).json({
        success: false,
        message: 'Topic is required'
      })
    }

    // Get user profile for personalization
    let user = await User.findOne({ firebaseUid: userId })

    // Generate quiz using OpenAI
    const quizData = await generateQuiz(topic, difficulty, parseInt(count), user?.profile)

    res.json({
      success: true,
      data: {
        _id: quizData._id,
        topic: quizData.topic,
        questions: quizData.questions // Should be an array of question objects
      }
    })
  } catch (error) {
    console.error('Generate quiz error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to generate quiz'
    })
  }
}

const submitQuiz = async (req, res) => {
  try {
    const { topic, questions, answers } = req.body
    const userId = req.user.uid

    if (!topic || !questions || !answers) {
      return res.status(400).json({
        success: false,
        message: 'Topic, questions, and answers are required'
      })
    }

    // Calculate score
    let score = 0
    const userAnswers = []

    questions.forEach((question, index) => {
      const userAnswer = answers[index]
      const isCorrect = userAnswer === question.correctAnswer
      
      if (isCorrect) {
        score++
      }

      userAnswers.push({
        questionIndex: index,
        selectedAnswer: userAnswer,
        isCorrect,
        timeSpent: 0 // You can track this on frontend
      })

      // Add incorrect answers to spaced repetition
      if (!isCorrect && userAnswer !== -1) {
        const reviewItem = new ReviewItem({
          userId,
          question: question.question,
          answer: question.options[question.correctAnswer],
          topic,
          difficulty: question.difficulty === 'easy' ? 2.0 : question.difficulty === 'hard' ? 3.0 : 2.5,
          source: 'quiz'
        })
        
        reviewItem.save().catch(err => console.error('Error saving review item:', err))
      }
    })

    const percentage = Math.round((score / questions.length) * 100)

    // Save quiz result
    const quizResult = new QuizResult({
      userId,
      topic,
      questions,
      userAnswers,
      score,
      totalQuestions: questions.length,
      percentage
    })

    await quizResult.save()

    // Update user stats
    await updateUserStats(userId, percentage)

    res.json({
      success: true,
      data: {
        score,
        totalQuestions: questions.length,
        percentage,
        result: quizResult
      }
    })
  } catch (error) {
    console.error('Submit quiz error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to submit quiz'
    })
  }
}

const getQuizResults = async (req, res) => {
  try {
    const userId = req.user.uid
    const { topic, limit = 10, page = 1 } = req.query

    const query = { userId }
    
    if (topic) {
      query.topic = { $regex: topic, $options: 'i' }
    }

    const results = await QuizResult.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select('-questions') // Exclude questions for performance

    const total = await QuizResult.countDocuments(query)

    res.json({
      success: true,
      data: results,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: results.length,
        totalItems: total
      }
    })
  } catch (error) {
    console.error('Get quiz results error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz results'
    })
  }
}

const getQuizStats = async (req, res) => {
  try {
    const userId = req.user.uid

    const stats = await QuizResult.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalQuizzes: { $sum: 1 },
          averageScore: { $avg: '$percentage' },
          bestScore: { $max: '$percentage' },
          totalQuestions: { $sum: '$totalQuestions' },
          totalCorrect: { $sum: '$score' }
        }
      }
    ])

    const topicStats = await QuizResult.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$topic',
          quizCount: { $sum: 1 },
          averageScore: { $avg: '$percentage' },
          bestScore: { $max: '$percentage' }
        }
      },
      { $sort: { quizCount: -1 } },
      { $limit: 10 }
    ])

    res.json({
      success: true,
      data: {
        overall: stats[0] || {
          totalQuizzes: 0,
          averageScore: 0,
          bestScore: 0,
          totalQuestions: 0,
          totalCorrect: 0
        },
        topics: topicStats
      }
    })
  } catch (error) {
    console.error('Get quiz stats error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz statistics'
    })
  }
}

const explainWrongAnswer = async (req, res) => {
  try {
    const { question, options, correctAnswer, userAnswer } = req.body

    if (!question || !options || correctAnswer === undefined || userAnswer === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Question, options, correct answer, and user answer are required'
      })
    }

    const explanation = await explainAnswer(question, options, correctAnswer, userAnswer)

    res.json({
      success: true,
      data: { explanation }
    })
  } catch (error) {
    console.error('Explain answer error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to generate explanation'
    })
  }
}

// Helper function to update user statistics
const updateUserStats = async (userId, percentage) => {
  try {
    let user = await User.findOne({ firebaseUid: userId })
    
    if (!user) {
      // Create user if doesn't exist
      user = new User({
        firebaseUid: userId,
        email: 'unknown@example.com',
        name: 'User'
      })
    }

    user.stats.totalQuizzes++
    
    // Update average score
    const totalScore = (user.stats.averageScore * (user.stats.totalQuizzes - 1)) + percentage
    user.stats.averageScore = Math.round(totalScore / user.stats.totalQuizzes)
    
    user.stats.lastActive = new Date()

    await user.save()
  } catch (error) {
    console.error('Error updating user stats:', error)
  }
}

module.exports = {
  generateQuizQuestions,
  submitQuiz,
  getQuizResults,
  getQuizStats,
  explainWrongAnswer
}