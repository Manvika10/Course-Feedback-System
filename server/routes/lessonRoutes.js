const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getLessonsByCourse,
  createLesson,
  updateLesson,
  deleteLesson,
} = require('../controllers/lessonController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

const lessonValidation = [
  body('courseId').notEmpty().withMessage('Course ID is required').isMongoId().withMessage('Invalid course ID'),
  body('title').notEmpty().withMessage('Lesson title is required').isLength({ min: 2, max: 200 }),
];

router.get('/:courseId', protect, getLessonsByCourse);
router.post('/', protect, adminOnly, lessonValidation, createLesson);
router.put('/:id', protect, adminOnly, updateLesson);
router.delete('/:id', protect, adminOnly, deleteLesson);

module.exports = router;
