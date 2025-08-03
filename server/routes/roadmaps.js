const express = require('express')
const router = express.Router()
const {
  createRoadmap,
  getRoadmaps,
  getRoadmapById,
  updateRoadmapProgress,
  deleteRoadmap
} = require('../controllers/roadmapController')

// Create new roadmap
router.post('/', createRoadmap)

// Get all roadmaps for user
router.get('/', getRoadmaps)

// Get specific roadmap
router.get('/:id', getRoadmapById)

// Update roadmap progress
router.put('/:id/progress', updateRoadmapProgress)

// Delete roadmap
router.delete('/:id', deleteRoadmap)

module.exports = router