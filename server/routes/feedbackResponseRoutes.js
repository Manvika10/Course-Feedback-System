const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  submitResponse,
  getResponses,
  getResponseAnalytics,
} = require('../controllers/feedbackResponseController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

const responseValidation = [
  body('formId').notEmpty().withMessage('Form ID is required').isMongoId().withMessage('Invalid form ID'),
  body('courseId').notEmpty().withMessage('Course ID is required').isMongoId().withMessage('Invalid course ID'),
  body('answers').isArray({ min: 1 }).withMessage('At least one answer is required'),
  body('identityMode')
    .optional()
    .isIn(['identified', 'anonymous', 'pseudonymous'])
    .withMessage('Invalid identity mode'),
];

router.post('/', protect, responseValidation, submitResponse);
router.get('/', protect, getResponses);
router.get('/analytics/:formId', protect, adminOnly, getResponseAnalytics);

module.exports = router;
