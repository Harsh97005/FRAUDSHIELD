const express = require('express');
const { body, validationResult } = require('express-validator');
const { analyzeMessage } = require('../engine/fraudDetector');

const router = express.Router();

// POST /analyze
router.post(
  '/analyze',
  [
    body('message')
      .trim()
      .notEmpty()
      .withMessage('Message cannot be empty')
      .isLength({ min: 5, max: 5000 })
      .withMessage('Message must be between 5 and 5000 characters'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    try {
      const { message } = req.body;
      const analysis = analyzeMessage(message);

      return res.status(200).json({
        success: true,
        result: analysis.result,
        score: analysis.score,
        risk: analysis.risk,
        explanation: analysis.explanation,
        suspiciousWords: analysis.suspiciousWords,
        detectionDetails: analysis.detectionDetails,
      });
    } catch (err) {
      console.error('Analysis error:', err);
      return res.status(500).json({
        success: false,
        error: 'Internal server error during analysis',
      });
    }
  }
);

// GET /health
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'SafeText AI Engine', version: '1.0.0' });
});

module.exports = router;
