const { validationResult } = require('express-validator');
const FeedbackForm = require('../models/FeedbackForm');

// @desc    Get all feedback forms (admin)
// @route   GET /api/feedback-forms
// @access  Admin
const getFeedbackForms = async (req, res) => {
  try {
    const { courseId, triggerType, isActive } = req.query;
    const query = {};
    if (courseId) query.courseId = courseId;
    if (triggerType) query.triggerType = triggerType;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const forms = await FeedbackForm.find(query)
      .populate('courseId', 'courseName')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json(forms);
  } catch (error) {
    console.error('Get feedback forms error:', error.message);
    res.status(500).json({ message: 'Server error fetching feedback forms' });
  }
};

// @desc    Get a single feedback form
// @route   GET /api/feedback-forms/:id
// @access  Private
const getFeedbackFormById = async (req, res) => {
  try {
    const form = await FeedbackForm.findById(req.params.id)
      .populate('courseId', 'courseName')
      .populate('createdBy', 'name');

    if (!form) {
      return res.status(404).json({ message: 'Feedback form not found' });
    }

    res.json(form);
  } catch (error) {
    console.error('Get feedback form error:', error.message);
    res.status(500).json({ message: 'Server error fetching feedback form' });
  }
};

// @desc    Get active form for a course (student-facing)
// @route   GET /api/feedback-forms/active/:courseId
// @access  Private
const getActiveFormForCourse = async (req, res) => {
  try {
    const { type, trigger } = req.query;
    const query = {
      isActive: true,
      $or: [{ courseId: req.params.courseId }, { courseId: null }],
    };
    if (type) query.formType = type;
    if (trigger) query.triggerType = trigger;

    const forms = await FeedbackForm.find(query)
      .populate('courseId', 'courseName')
      .sort({ createdAt: -1 });

    // Prioritize course-specific forms over global ones
    const courseSpecific = forms.filter((f) => f.courseId && f.courseId._id.toString() === req.params.courseId);
    const result = courseSpecific.length > 0 ? courseSpecific : forms;

    res.json(result);
  } catch (error) {
    console.error('Get active form error:', error.message);
    res.status(500).json({ message: 'Server error fetching active form' });
  }
};

// @desc    Create feedback form (admin)
// @route   POST /api/feedback-forms
// @access  Admin
const createFeedbackForm = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  }

  try {
    const form = await FeedbackForm.create({
      ...req.body,
      createdBy: req.user._id,
    });

    const populated = await FeedbackForm.findById(form._id)
      .populate('courseId', 'courseName')
      .populate('createdBy', 'name');

    res.status(201).json(populated);
  } catch (error) {
    console.error('Create feedback form error:', error.message);
    res.status(500).json({ message: 'Server error creating feedback form' });
  }
};

// @desc    Update feedback form (admin)
// @route   PUT /api/feedback-forms/:id
// @access  Admin
const updateFeedbackForm = async (req, res) => {
  try {
    const form = await FeedbackForm.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('courseId', 'courseName')
      .populate('createdBy', 'name');

    if (!form) {
      return res.status(404).json({ message: 'Feedback form not found' });
    }

    res.json(form);
  } catch (error) {
    console.error('Update feedback form error:', error.message);
    res.status(500).json({ message: 'Server error updating feedback form' });
  }
};

// @desc    Delete feedback form (admin)
// @route   DELETE /api/feedback-forms/:id
// @access  Admin
const deleteFeedbackForm = async (req, res) => {
  try {
    const form = await FeedbackForm.findByIdAndDelete(req.params.id);
    if (!form) {
      return res.status(404).json({ message: 'Feedback form not found' });
    }
    res.json({ message: 'Feedback form deleted successfully' });
  } catch (error) {
    console.error('Delete feedback form error:', error.message);
    res.status(500).json({ message: 'Server error deleting feedback form' });
  }
};

// @desc    Trigger a feedback form prompt (instructor)
// @route   POST /api/feedback-forms/:id/trigger
// @access  Admin
const triggerFormPrompt = async (req, res) => {
  try {
    const form = await FeedbackForm.findById(req.params.id);
    if (!form) {
      return res.status(404).json({ message: 'Feedback form not found' });
    }

    // This endpoint signals that the form has been instructor-triggered
    // The frontend polls or listens for active triggered forms
    form.triggerType = 'instructor_prompt';
    form.isActive = true;
    await form.save();

    res.json({ message: 'Form prompt triggered successfully', form });
  } catch (error) {
    console.error('Trigger form error:', error.message);
    res.status(500).json({ message: 'Server error triggering form' });
  }
};

module.exports = {
  getFeedbackForms,
  getFeedbackFormById,
  getActiveFormForCourse,
  createFeedbackForm,
  updateFeedbackForm,
  deleteFeedbackForm,
  triggerFormPrompt,
};
