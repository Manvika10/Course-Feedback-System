const { validationResult } = require('express-validator');
const FeedbackResponse = require('../models/FeedbackResponse');
const FeedbackForm = require('../models/FeedbackForm');

// @desc    Submit a feedback response
// @route   POST /api/feedback-responses
// @access  Private (student)
const submitResponse = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  }

  const { formId, courseId, lessonId, answers, identityMode, triggerSource } = req.body;

  try {
    // Verify form exists
    const form = await FeedbackForm.findById(formId);
    if (!form) {
      return res.status(404).json({ message: 'Feedback form not found' });
    }

    // Check for duplicate submission
    const existing = await FeedbackResponse.findOne({
      studentId: req.user._id,
      formId,
      lessonId: lessonId || null,
    });
    if (existing) {
      return res.status(400).json({ message: 'You have already responded to this form' });
    }

    // Validate required questions
    const requiredQuestions = form.questions
      .map((q, idx) => ({ ...q.toObject(), idx }))
      .filter((q) => q.required);

    for (const rq of requiredQuestions) {
      const answerEntry = answers.find((a) => a.questionIndex === rq.idx);
      if (!answerEntry || answerEntry.answer === null || answerEntry.answer === '' || answerEntry.answer === undefined) {
        return res.status(400).json({
          message: `Question "${rq.questionText}" is required`,
        });
      }
    }

    const response = await FeedbackResponse.create({
      formId,
      studentId: req.user._id,
      courseId,
      lessonId: lessonId || null,
      answers,
      identityMode: identityMode || 'identified',
      triggerSource: triggerSource || 'manual',
    });

    const populated = await FeedbackResponse.findById(response._id)
      .populate('formId', 'title')
      .populate('courseId', 'courseName');

    res.status(201).json({
      message: 'Response submitted successfully!',
      response: populated,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already responded to this form' });
    }
    console.error('Submit response error:', error.message);
    res.status(500).json({ message: 'Server error submitting response' });
  }
};

// @desc    Get feedback responses
// @route   GET /api/feedback-responses
// @access  Private
const getResponses = async (req, res) => {
  try {
    const { formId, courseId, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    let query = {};

    if (req.user.role === 'admin') {
      if (formId) query.formId = formId;
      if (courseId) query.courseId = courseId;
    } else {
      query.studentId = req.user._id;
      if (formId) query.formId = formId;
    }

    const total = await FeedbackResponse.countDocuments(query);
    const responses = await FeedbackResponse.find(query)
      .populate('formId', 'title questions')
      .populate('courseId', 'courseName')
      .populate('lessonId', 'title')
      .populate('studentId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Mask identity for anonymous/pseudonymous responses
    const sanitized = responses.map((r) => {
      const rObj = r.toObject();
      if (rObj.identityMode === 'anonymous') {
        rObj.studentId = { name: 'Anonymous', email: '***' };
      } else if (rObj.identityMode === 'pseudonymous') {
        rObj.studentId = { name: rObj.pseudonym || 'Unknown', email: '***' };
      }
      return rObj;
    });

    res.json({
      responses: sanitized,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get responses error:', error.message);
    res.status(500).json({ message: 'Server error fetching responses' });
  }
};

// @desc    Get response analytics for a form
// @route   GET /api/feedback-responses/analytics/:formId
// @access  Admin
const getResponseAnalytics = async (req, res) => {
  try {
    const form = await FeedbackForm.findById(req.params.formId);
    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    const responses = await FeedbackResponse.find({ formId: req.params.formId });
    const totalResponses = responses.length;

    // Build per-question analytics
    const questionAnalytics = form.questions.map((q, idx) => {
      const answers = responses
        .map((r) => r.answers.find((a) => a.questionIndex === idx))
        .filter(Boolean)
        .map((a) => a.answer);

      const analytics = {
        questionText: q.questionText,
        questionType: q.questionType,
        totalAnswers: answers.length,
      };

      switch (q.questionType) {
        case 'star_rating':
        case 'likert':
        case 'numeric_slider':
        case 'nps': {
          const numericAnswers = answers.filter((a) => typeof a === 'number');
          analytics.average = numericAnswers.length
            ? Math.round((numericAnswers.reduce((s, v) => s + v, 0) / numericAnswers.length) * 10) / 10
            : 0;
          analytics.distribution = {};
          numericAnswers.forEach((v) => {
            analytics.distribution[v] = (analytics.distribution[v] || 0) + 1;
          });
          // NPS specific
          if (q.questionType === 'nps') {
            const detractors = numericAnswers.filter((v) => v <= 6).length;
            const promoters = numericAnswers.filter((v) => v >= 9).length;
            analytics.npsScore = numericAnswers.length
              ? Math.round(((promoters - detractors) / numericAnswers.length) * 100)
              : 0;
          }
          break;
        }
        case 'multiple_choice':
        case 'emoji_reaction':
        case 'thumbs_up_down': {
          analytics.distribution = {};
          answers.forEach((v) => {
            analytics.distribution[v] = (analytics.distribution[v] || 0) + 1;
          });
          break;
        }
        case 'ranking': {
          // Calculate average position for each option
          analytics.averageRanks = {};
          if (answers.length > 0 && Array.isArray(answers[0])) {
            const allItems = [...new Set(answers.flat())];
            allItems.forEach((item) => {
              const positions = answers.map((a) => a.indexOf(item)).filter((p) => p >= 0);
              analytics.averageRanks[item] = positions.length
                ? Math.round((positions.reduce((s, v) => s + v, 0) / positions.length) * 10) / 10
                : null;
            });
          }
          break;
        }
        case 'free_text': {
          analytics.sampleAnswers = answers.slice(0, 10);
          break;
        }
        case 'rubric': {
          analytics.criteriaAverages = {};
          answers.forEach((rubricAnswer) => {
            if (Array.isArray(rubricAnswer)) {
              rubricAnswer.forEach((entry) => {
                if (!analytics.criteriaAverages[entry.criterion]) {
                  analytics.criteriaAverages[entry.criterion] = { total: 0, count: 0 };
                }
                analytics.criteriaAverages[entry.criterion].total += entry.score;
                analytics.criteriaAverages[entry.criterion].count += 1;
              });
            }
          });
          // Calculate averages
          Object.keys(analytics.criteriaAverages).forEach((key) => {
            const { total, count } = analytics.criteriaAverages[key];
            analytics.criteriaAverages[key] = count ? Math.round((total / count) * 10) / 10 : 0;
          });
          break;
        }
      }

      return analytics;
    });

    // Identity mode distribution
    const identityDist = {};
    responses.forEach((r) => {
      identityDist[r.identityMode] = (identityDist[r.identityMode] || 0) + 1;
    });

    // Trigger source distribution
    const triggerDist = {};
    responses.forEach((r) => {
      triggerDist[r.triggerSource] = (triggerDist[r.triggerSource] || 0) + 1;
    });

    res.json({
      formTitle: form.title,
      totalResponses,
      questionAnalytics,
      identityDistribution: identityDist,
      triggerDistribution: triggerDist,
    });
  } catch (error) {
    console.error('Response analytics error:', error.message);
    res.status(500).json({ message: 'Server error fetching response analytics' });
  }
};

module.exports = { submitResponse, getResponses, getResponseAnalytics };
