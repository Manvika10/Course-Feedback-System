const { validationResult } = require('express-validator');
const Lesson = require('../models/Lesson');
const Course = require('../models/Course');

// @desc    Get all lessons for a course
// @route   GET /api/lessons/:courseId
// @access  Private
const getLessonsByCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const lessons = await Lesson.find({
      courseId: req.params.courseId,
      isActive: true,
    }).sort({ order: 1 });

    res.json(lessons);
  } catch (error) {
    console.error('Get lessons error:', error.message);
    res.status(500).json({ message: 'Server error fetching lessons' });
  }
};

// @desc    Create a lesson
// @route   POST /api/lessons
// @access  Admin
const createLesson = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  }

  const { courseId, title, order, description } = req.body;

  try {
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Auto-assign order if not provided
    let lessonOrder = order;
    if (lessonOrder === undefined || lessonOrder === null) {
      const lastLesson = await Lesson.findOne({ courseId }).sort({ order: -1 });
      lessonOrder = lastLesson ? lastLesson.order + 1 : 1;
    }

    const lesson = await Lesson.create({
      courseId,
      title,
      order: lessonOrder,
      description: description || '',
    });

    res.status(201).json(lesson);
  } catch (error) {
    console.error('Create lesson error:', error.message);
    res.status(500).json({ message: 'Server error creating lesson' });
  }
};

// @desc    Update a lesson
// @route   PUT /api/lessons/:id
// @access  Admin
const updateLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    res.json(lesson);
  } catch (error) {
    console.error('Update lesson error:', error.message);
    res.status(500).json({ message: 'Server error updating lesson' });
  }
};

// @desc    Delete a lesson
// @route   DELETE /api/lessons/:id
// @access  Admin
const deleteLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findByIdAndDelete(req.params.id);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }
    res.json({ message: 'Lesson deleted successfully' });
  } catch (error) {
    console.error('Delete lesson error:', error.message);
    res.status(500).json({ message: 'Server error deleting lesson' });
  }
};

module.exports = { getLessonsByCourse, createLesson, updateLesson, deleteLesson };
