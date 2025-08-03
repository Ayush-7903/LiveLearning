const Roadmap = require('../models/Roadmap')
const User = require('../models/User')
const { generateRoadmap } = require('../utils/openai')

const createRoadmap = async (req, res) => {
  try {
    const { topic, level } = req.body
    const userId = req.user.uid

    if (!topic || !level) {
      return res.status(400).json({
        success: false,
        message: 'Topic and level are required'
      })
    }

    // Get user profile for personalization
    let user = await User.findOne({ firebaseUid: userId })
    
    // Generate roadmap using OpenAI
    const roadmapData = await generateRoadmap(topic, level, user?.profile)

    // Create roadmap in database
    const roadmap = new Roadmap({
      userId,
      title: roadmapData.title,
      description: roadmapData.description,
      topic,
      level,
      steps: roadmapData.steps.map((step, index) => ({
        ...step,
        order: index + 1,
        completed: false
      })),
      estimatedDuration: roadmapData.estimatedDuration,
      tags: roadmapData.tags || []
    })
    roadmap.calculateProgress()
    await roadmap.save()

    res.status(201).json({
      success: true,
      data: roadmap
    })
  } catch (error) {
    console.error('Create roadmap error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create roadmap'
    })
  }
}

const getRoadmaps = async (req, res) => {
  try {
    const userId = req.user.uid
    const { status, topic, limit = 10, page = 1 } = req.query

    const query = { userId }
    
    if (status) {
      query.status = status
    }
    
    if (topic) {
      query.topic = { $regex: topic, $options: 'i' }
    }

    const roadmaps = await Roadmap.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))

    const total = await Roadmap.countDocuments(query)

    res.json({
      success: true,
      data: roadmaps,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: roadmaps.length,
        totalItems: total
      }
    })
  } catch (error) {
    console.error('Get roadmaps error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch roadmaps'
    })
  }
}

const getRoadmapById = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.uid

    const roadmap = await Roadmap.findOne({ _id: id, userId })

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found'
      })
    }

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

const updateRoadmapProgress = async (req, res) => {
  try {
    const { id } = req.params
    const { stepIndex } = req.body
    const userId = req.user.uid

    const roadmap = await Roadmap.findOne({ _id: id, userId })

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found'
      })
    }

    if (stepIndex < 0 || stepIndex >= roadmap.steps.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid step index'
      })
    }

    // Toggle step completion
    const step = roadmap.steps[stepIndex]
    step.completed = !step.completed
    step.completedAt = step.completed ? new Date() : null

    // Recalculate progress
    roadmap.calculateProgress()

    await roadmap.save()

    res.json({
      success: true,
      data: roadmap
    })
  } catch (error) {
    console.error('Update roadmap progress error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update progress'
    })
  }
}

const deleteRoadmap = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.uid

    const roadmap = await Roadmap.findOneAndDelete({ _id: id, userId })

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found'
      })
    }

    res.json({
      success: true,
      message: 'Roadmap deleted successfully'
    })
  } catch (error) {
    console.error('Delete roadmap error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete roadmap'
    })
  }
}

module.exports = {
  createRoadmap,
  getRoadmaps,
  getRoadmapById,
  updateRoadmapProgress,
  deleteRoadmap
}