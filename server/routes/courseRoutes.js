const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
} = require('../controllers/courseController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// Validation for course creation
const courseValidation = [
  body('courseName').trim().notEmpty().withMessage('Course name is required').isLength({ min: 3 }).withMessage('Course name must be at least 3 characters'),
  body('facultyName').trim().notEmpty().withMessage('Faculty name is required'),
];

// Public routes (still requires authentication)
router.get('/', protect, getCourses);
router.get('/:id', protect, getCourseById);

// Admin only routes
router.post('/', protect, adminOnly, courseValidation, createCourse);
router.put('/:id', protect, adminOnly, updateCourse);
router.delete('/:id', protect, adminOnly, deleteCourse);

module.exports = router;
