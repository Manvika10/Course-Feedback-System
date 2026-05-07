const { validationResult } = require('express-validator');
const Course = require('../models/Course');

// @desc    Get all active courses
// @route   GET /api/courses
// @access  Private
const getCourses = async (req, res) => {
  try {
    const { search, department } = req.query;
    let query = { isActive: true };

    if (search) {
      query.$or = [
        { courseName: { $regex: search, $options: 'i' } },
        { facultyName: { $regex: search, $options: 'i' } },
        { courseCode: { $regex: search, $options: 'i' } },
      ];
    }

    if (department) {
      query.department = { $regex: department, $options: 'i' };
    }

    const courses = await Course.find(query).sort({ createdAt: -1 });
    res.json(courses);
  } catch (error) {
    console.error('Get courses error:', error.message);
    res.status(500).json({ message: 'Server error fetching courses' });
  }
};

// @desc    Get a single course by ID
// @route   GET /api/courses/:id
// @access  Private
const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json(course);
  } catch (error) {
    console.error('Get course error:', error.message);
    res.status(500).json({ message: 'Server error fetching course' });
  }
};

// @desc    Create a new course (admin only)
// @route   POST /api/courses
// @access  Admin
const createCourse = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  }

  const { courseName, courseCode, facultyName, department, semester, description } = req.body;

  try {
    const courseExists = await Course.findOne({ courseName });
    if (courseExists) {
      return res.status(400).json({ message: 'A course with this name already exists' });
    }

    const course = await Course.create({
      courseName,
      courseCode,
      facultyName,
      department,
      semester,
      description,
    });

    res.status(201).json(course);
  } catch (error) {
    console.error('Create course error:', error.message);
    res.status(500).json({ message: 'Server error creating course' });
  }
};

// @desc    Update a course (admin only)
// @route   PUT /api/courses/:id
// @access  Admin
const updateCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json(course);
  } catch (error) {
    console.error('Update course error:', error.message);
    res.status(500).json({ message: 'Server error updating course' });
  }
};

// @desc    Delete a course (admin only)
// @route   DELETE /api/courses/:id
// @access  Admin
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Delete course error:', error.message);
    res.status(500).json({ message: 'Server error deleting course' });
  }
};

module.exports = { getCourses, getCourseById, createCourse, updateCourse, deleteCourse };
