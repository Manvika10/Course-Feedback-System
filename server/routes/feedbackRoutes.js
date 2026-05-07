const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  submitFeedback,
  getFeedback,
  getFeedbackAnalytics,
  deleteFeedback,
  checkFeedbackSubmitted,
} = require('../controllers/feedbackController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// Validation for feedback submission
const feedbackValidation = [
  body('courseId').notEmpty().withMessage('Course ID is required').isMongoId().withMessage('Invalid course ID'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().isLength({ max: 500 }).withMessage('Comment cannot exceed 500 characters'),
  body('feedbackType').optional().isIn(['micro', 'macro']).withMessage('Invalid feedback type'),
  body('identityMode').optional().isIn(['identified', 'anonymous', 'pseudonymous']).withMessage('Invalid identity mode'),
  body('emojiReaction').optional().isIn(['angry', 'sad', 'neutral', 'happy', 'love']).withMessage('Invalid emoji reaction'),
  body('thumbsUpDown').optional().isIn(['up', 'down']).withMessage('Invalid thumbs value'),
  body('npsScore').optional().isInt({ min: 0, max: 10 }).withMessage('NPS score must be between 0 and 10'),
];

// Routes
router.post('/', protect, feedbackValidation, submitFeedback);
router.get('/', protect, getFeedback);
router.get('/analytics', protect, adminOnly, getFeedbackAnalytics);
router.get('/check/:courseId', protect, checkFeedbackSubmitted);
router.delete('/:id', protect, adminOnly, deleteFeedback);

module.exports = router;
