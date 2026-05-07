const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getFeedbackForms,
  getFeedbackFormById,
  getActiveFormForCourse,
  createFeedbackForm,
  updateFeedbackForm,
  deleteFeedbackForm,
  triggerFormPrompt,
} = require('../controllers/feedbackFormController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

const formValidation = [
  body('title').notEmpty().withMessage('Form title is required'),
  body('questions')
    .isArray({ min: 1 })
    .withMessage('Form must have at least one question'),
  body('questions.*.questionText')
    .notEmpty()
    .withMessage('Each question must have text'),
  body('questions.*.questionType')
    .isIn([
      'free_text', 'multiple_choice', 'ranking', 'likert', 'rubric',
      'star_rating', 'emoji_reaction', 'thumbs_up_down', 'nps', 'numeric_slider',
    ])
    .withMessage('Invalid question type'),
];

router.get('/', protect, adminOnly, getFeedbackForms);
router.get('/active/:courseId', protect, getActiveFormForCourse);
router.get('/:id', protect, getFeedbackFormById);
router.post('/', protect, adminOnly, formValidation, createFeedbackForm);
router.put('/:id', protect, adminOnly, updateFeedbackForm);
router.delete('/:id', protect, adminOnly, deleteFeedbackForm);
router.post('/:id/trigger', protect, adminOnly, triggerFormPrompt);

module.exports = router;
