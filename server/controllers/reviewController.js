const ReviewItem = require('../models/ReviewItem')
const User = require('../models/User')

const getDueReviews = async (req, res) => {
  try {
    const userId = req.user.uid
    const { limit = 20 } = req.query

    const dueItems = await ReviewItem.find({
      userId,
      nextReview: { $lte: new Date() }
    })
    .sort({ nextReview: 1 })
    .limit(parseInt(limit))

    res.json({
      success: true,
      data: dueItems
    })
  } catch (error) {
    console.error('Get due reviews error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch due reviews'
    })
  }
}

const respondToReview = async (req, res) => {
  try {
    const { itemId, quality } = req.body
    const userId = req.user.uid

    if (quality < 0 || quality > 5) {
      return res.status(400).json({
        success: false,
        message: 'Quality must be between 0 and 5'
      })
    }

    const reviewItem = await ReviewItem.findOne({ _id: itemId, userId })

    if (!reviewItem) {
      return res.status(404).json({
        success: false,
        message: 'Review item not found'
      })
    }

    // Update using SM-2 algorithm
    reviewItem.updateSpacedRepetition(quality)
    await reviewItem.save()

    res.json({
      success: true,
      data: {
        nextReview: reviewItem.nextReview,
        interval: reviewItem.interval,
        repetitions: reviewItem.repetitions
      }
    })
  } catch (error) {
    console.error('Respond to review error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to record review response'
    })
  }
}

const getReviewStats = async (req, res) => {
  try {
    const userId = req.user.uid

    const stats = await ReviewItem.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          averageQuality: { $avg: '$averageQuality' },
          totalReviews: { $sum: '$reviewCount' },
          dueToday: {
            $sum: {
              $cond: [
                { $lte: ['$nextReview', new Date()] },
                1,
                0
              ]
            }
          }
        }
      }
    ])

    const topicStats = await ReviewItem.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$topic',
          itemCount: { $sum: 1 },
          averageQuality: { $avg: '$averageQuality' },
          dueCount: {
            $sum: {
              $cond: [
                { $lte: ['$nextReview', new Date()] },
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { itemCount: -1 } }
    ])

    res.json({
      success: true,
      data: {
        overall: stats[0] || {
          totalItems: 0,
          averageQuality: 0,
          totalReviews: 0,
          dueToday: 0
        },
        topics: topicStats
      }
    })
  } catch (error) {
    console.error('Get review stats error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch review statistics'
    })
  }
}

const addReviewItem = async (req, res) => {
  try {
    const { question, answer, topic, subtopic } = req.body
    const userId = req.user.uid

    if (!question || !topic) {
      return res.status(400).json({
        success: false,
        message: 'Question and topic are required'
      })
    }

    const reviewItem = new ReviewItem({
      userId,
      question,
      answer,
      topic,
      subtopic,
      source: 'manual'
    })

    await reviewItem.save()

    res.status(201).json({
      success: true,
      data: reviewItem
    })
  } catch (error) {
    console.error('Add review item error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to add review item'
    })
  }
}

const deleteReviewItem = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.uid

    const reviewItem = await ReviewItem.findOneAndDelete({ _id: id, userId })

    if (!reviewItem) {
      return res.status(404).json({
        success: false,
        message: 'Review item not found'
      })
    }

    res.json({
      success: true,
      message: 'Review item deleted successfully'
    })
  } catch (error) {
    console.error('Delete review item error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete review item'
    })
  }
}

module.exports = {
  getDueReviews,
  respondToReview,
  getReviewStats,
  addReviewItem,
  deleteReviewItem
}