const express = require('express')
const router = express.Router()

// Auth routes are handled by Firebase on the frontend
// This file exists for potential future auth-related server operations

router.get('/verify', (req, res) => {
  res.json({
    success: true,
    message: 'Auth routes are handled by Firebase on the frontend'
  })
})

module.exports = router