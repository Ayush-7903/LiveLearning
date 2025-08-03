const User = require('../models/User')

const getProfile = async (req, res) => {
  try {
    const userId = req.user.uid

    let user = await User.findOne({ firebaseUid: userId })

    if (!user) {
      // Create user profile if doesn't exist
      user = new User({
        firebaseUid: userId,
        email: req.user.email,
        name: req.user.name
      })
      await user.save()
    }

    res.json({
      success: true,
      data: user.profile
    })
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    })
  }
}

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.uid
    const profileUpdate = req.body

    // Validate learning styles
    const validLearningStyles = ['Visual', 'Auditory', 'Hands-on', 'Reading/Writing', 'Fast Learner', 'Step-by-step']
    if (profileUpdate.learningStyle) {
      profileUpdate.learningStyle = profileUpdate.learningStyle.filter(style => 
        validLearningStyles.includes(style)
      )
    }

    // Validate skill level
    const validSkillLevels = ['beginner', 'intermediate', 'advanced']
    if (profileUpdate.skillLevel && !validSkillLevels.includes(profileUpdate.skillLevel)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid skill level'
      })
    }

    let user = await User.findOne({ firebaseUid: userId })

    if (!user) {
      user = new User({
        firebaseUid: userId,
        email: req.user.email,
        name: req.user.name,
        profile: profileUpdate
      })
    } else {
      // Update profile fields
      Object.assign(user.profile, profileUpdate)
    }

    await user.save()

    res.json({
      success: true,
      data: user.profile
    })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    })
  }
}

const getUserStats = async (req, res) => {
  try {
    const userId = req.user.uid

    const user = await User.findOne({ firebaseUid: userId })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    res.json({
      success: true,
      data: user.stats
    })
  } catch (error) {
    console.error('Get user stats error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics'
    })
  }
}

const updateUserStats = async (req, res) => {
  try {
    const userId = req.user.uid
    const statsUpdate = req.body

    const user = await User.findOne({ firebaseUid: userId })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Update only allowed stats fields
    const allowedFields = ['totalStudyTime', 'streak']
    Object.keys(statsUpdate).forEach(key => {
      if (allowedFields.includes(key)) {
        user.stats[key] = statsUpdate[key]
      }
    })

    user.stats.lastActive = new Date()

    await user.save()

    res.json({
      success: true,
      data: user.stats
    })
  } catch (error) {
    console.error('Update user stats error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update user statistics'
    })
  }
}

const getRoadmap = async (req, res) => {
  try {
    const userId = req.user.uid

    const user = await User.findOne({ firebaseUid: userId })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    const roadmap = user.roadmap // Assuming roadmap is a field in the user document

    res.json({
      success: true,
      data: roadmap
    })
  } catch (error) {
    console.error('Get roadmap error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch roadmap'
    })
  }
}

const updateRoadmap = async (req, res) => {
  try {
    const userId = req.user.uid
    const { roadmap } = req.body

    const user = await User.findOne({ firebaseUid: userId })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    user.roadmap = roadmap // Update the roadmap field

    await user.save()

    res.json({
      success: true,
      data: user.roadmap
    })
  } catch (error) {
    console.error('Update roadmap error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update roadmap'
    })
  }
}

module.exports = {
  getProfile,
  updateProfile,
  getUserStats,
  updateUserStats,
  getRoadmap,
  updateRoadmap
}