const { validationResult } = require('express-validator');
const Feedback = require('../models/Feedback');
const Course = require('../models/Course');

// @desc    Submit feedback for a course
// @route   POST /api/feedback
// @access  Private (student)
const submitFeedback = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  }

  const {
    courseId, rating, comment, anonymous,
    teachingQuality, courseContent, overallSatisfaction,
    // New fields
    lessonId, feedbackType, emojiReaction, thumbsUpDown,
    npsScore, sliderRatings, identityMode,
  } = req.body;

  try {
    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check for duplicate submission (new compound: studentId + courseId + lessonId + feedbackType)
    const existingFeedback = await Feedback.findOne({
      studentId: req.user._id,
      courseId,
      lessonId: lessonId || null,
      feedbackType: feedbackType || 'macro',
    });

    if (existingFeedback) {
      return res.status(400).json({
        message: feedbackType === 'micro'
          ? 'You have already submitted feedback for this lesson'
          : 'You have already submitted feedback for this course',
      });
    }

    // Determine identity mode
    let resolvedIdentityMode = identityMode || 'identified';
    if (anonymous === true && !identityMode) {
      resolvedIdentityMode = 'anonymous';
    }

    const feedback = await Feedback.create({
      studentId: req.user._id,
      courseId,
      lessonId: lessonId || null,
      feedbackType: feedbackType || 'macro',
      rating,
      comment: comment || '',
      anonymous: resolvedIdentityMode === 'anonymous',
      identityMode: resolvedIdentityMode,
      teachingQuality,
      courseContent,
      overallSatisfaction,
      emojiReaction: emojiReaction || null,
      thumbsUpDown: thumbsUpDown || null,
      npsScore: npsScore !== undefined ? npsScore : null,
      sliderRatings: sliderRatings || {},
    });

    const populated = await Feedback.findById(feedback._id)
      .populate('courseId', 'courseName facultyName')
      .populate('lessonId', 'title');

    res.status(201).json({
      message: 'Feedback submitted successfully!',
      feedback: populated,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already submitted feedback for this course' });
    }
    console.error('Submit feedback error:', error.message);
    res.status(500).json({ message: 'Server error submitting feedback' });
  }
};

// @desc    Get feedback for a student (their own) / all for admin
// @route   GET /api/feedback
// @access  Private
const getFeedback = async (req, res) => {
  try {
    const { courseId, lessonId, feedbackType, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    if (req.user.role === 'admin') {
      if (courseId) query.courseId = courseId;
      if (lessonId) query.lessonId = lessonId;
      if (feedbackType) query.feedbackType = feedbackType;
    } else {
      query.studentId = req.user._id;
      if (courseId) query.courseId = courseId;
      if (lessonId) query.lessonId = lessonId;
      if (feedbackType) query.feedbackType = feedbackType;
    }

    const total = await Feedback.countDocuments(query);
    const feedbacks = await Feedback.find(query)
      .populate('courseId', 'courseName facultyName department')
      .populate('lessonId', 'title order')
      .populate({
        path: 'studentId',
        select: 'name email',
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Mask student name based on identity mode
    const sanitized = feedbacks.map((fb) => {
      const fbObj = fb.toObject();
      if (req.user.role === 'admin') {
        if (fbObj.identityMode === 'anonymous' || fbObj.anonymous) {
          fbObj.studentId = { name: 'Anonymous', email: '***' };
        } else if (fbObj.identityMode === 'pseudonymous') {
          fbObj.studentId = { name: fbObj.pseudonym || 'Pseudonymous', email: '***' };
        }
      }
      return fbObj;
    });

    res.json({
      feedbacks: sanitized,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get feedback error:', error.message);
    res.status(500).json({ message: 'Server error fetching feedback' });
  }
};

// @desc    Get all feedback analytics (admin)
// @route   GET /api/feedback/analytics
// @access  Admin
const getFeedbackAnalytics = async (req, res) => {
  try {
    // Average rating per course
    const courseAnalytics = await Feedback.aggregate([
      {
        $group: {
          _id: '$courseId',
          avgRating: { $avg: '$rating' },
          totalFeedbacks: { $sum: 1 },
          avgTeachingQuality: { $avg: '$teachingQuality' },
          avgCourseContent: { $avg: '$courseContent' },
          avgOverallSatisfaction: { $avg: '$overallSatisfaction' },
          avgNps: { $avg: '$npsScore' },
        },
      },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'course',
        },
      },
      { $unwind: '$course' },
      {
        $project: {
          courseName: '$course.courseName',
          facultyName: '$course.facultyName',
          department: '$course.department',
          avgRating: { $round: ['$avgRating', 1] },
          totalFeedbacks: 1,
          avgTeachingQuality: { $round: ['$avgTeachingQuality', 1] },
          avgCourseContent: { $round: ['$avgCourseContent', 1] },
          avgOverallSatisfaction: { $round: ['$avgOverallSatisfaction', 1] },
          avgNps: { $round: ['$avgNps', 1] },
        },
      },
      { $sort: { avgRating: -1 } },
    ]);

    // Rating distribution (1-5)
    const ratingDist = await Feedback.aggregate([
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Total stats
    const totalFeedbacks = await Feedback.countDocuments();
    const overallAvg = await Feedback.aggregate([
      { $group: { _id: null, avg: { $avg: '$rating' } } },
    ]);

    // Feedback over time (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const feedbackTrend = await Feedback.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // NEW: Emoji reaction distribution
    const emojiDist = await Feedback.aggregate([
      { $match: { emojiReaction: { $ne: null } } },
      { $group: { _id: '$emojiReaction', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // NEW: Thumbs up/down distribution
    const thumbsDist = await Feedback.aggregate([
      { $match: { thumbsUpDown: { $ne: null } } },
      { $group: { _id: '$thumbsUpDown', count: { $sum: 1 } } },
    ]);

    // NEW: NPS calculation
    const npsResponses = await Feedback.find({ npsScore: { $ne: null } }).select('npsScore');
    let npsResult = { score: 0, detractors: 0, passives: 0, promoters: 0, total: 0 };
    if (npsResponses.length > 0) {
      npsResult.total = npsResponses.length;
      npsResponses.forEach((r) => {
        if (r.npsScore <= 6) npsResult.detractors++;
        else if (r.npsScore <= 8) npsResult.passives++;
        else npsResult.promoters++;
      });
      npsResult.score = Math.round(
        ((npsResult.promoters - npsResult.detractors) / npsResult.total) * 100
      );
    }

    // NEW: Feedback type breakdown (micro vs macro)
    const typeDist = await Feedback.aggregate([
      { $group: { _id: '$feedbackType', count: { $sum: 1 } } },
    ]);

    // NEW: Identity mode distribution
    const identityDist = await Feedback.aggregate([
      { $group: { _id: '$identityMode', count: { $sum: 1 } } },
    ]);

    res.json({
      totalFeedbacks,
      overallAvgRating: overallAvg[0] ? Math.round(overallAvg[0].avg * 10) / 10 : 0,
      courseAnalytics,
      ratingDistribution: ratingDist,
      feedbackTrend,
      emojiDistribution: emojiDist,
      thumbsDistribution: thumbsDist,
      npsResult,
      feedbackTypeDistribution: typeDist,
      identityDistribution: identityDist,
    });
  } catch (error) {
    console.error('Analytics error:', error.message);
    res.status(500).json({ message: 'Server error fetching analytics' });
  }
};

// @desc    Delete feedback (admin only)
// @route   DELETE /api/feedback/:id
// @access  Admin
const deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }
    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    console.error('Delete feedback error:', error.message);
    res.status(500).json({ message: 'Server error deleting feedback' });
  }
};

// @desc    Check if student has submitted feedback for a course
// @route   GET /api/feedback/check/:courseId
// @access  Private (student)
const checkFeedbackSubmitted = async (req, res) => {
  try {
    const { lessonId, feedbackType } = req.query;
    const query = {
      studentId: req.user._id,
      courseId: req.params.courseId,
    };
    if (lessonId) query.lessonId = lessonId;
    if (feedbackType) query.feedbackType = feedbackType;

    const feedback = await Feedback.findOne(query);
    res.json({ submitted: !!feedback, feedback: feedback || null });
  } catch (error) {
    res.status(500).json({ message: 'Server error checking feedback' });
  }
};

module.exports = {
  submitFeedback,
  getFeedback,
  getFeedbackAnalytics,
  deleteFeedback,
  checkFeedbackSubmitted,
};
