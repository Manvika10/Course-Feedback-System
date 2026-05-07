const mongoose = require('mongoose');

// Sub-schema for conditional/branching logic
const conditionalLogicSchema = new mongoose.Schema(
  {
    dependsOnQuestion: {
      type: Number, // index of the question this depends on
      required: true,
    },
    operator: {
      type: String,
      enum: ['equals', 'not_equals', 'less_than', 'greater_than', 'contains'],
      default: 'equals',
    },
    value: {
      type: mongoose.Schema.Types.Mixed, // the value to compare against
      required: true,
    },
  },
  { _id: false }
);

// Sub-schema for rubric criteria
const rubricCriterionSchema = new mongoose.Schema(
  {
    criterion: { type: String, required: true },
    levels: [
      {
        label: { type: String, required: true },
        score: { type: Number, required: true },
        description: { type: String },
      },
    ],
  },
  { _id: false }
);

// Sub-schema for each question in the form
const questionSchema = new mongoose.Schema(
  {
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
    },
    questionType: {
      type: String,
      required: true,
      enum: [
        'free_text',
        'multiple_choice',
        'ranking',
        'likert',
        'rubric',
        'star_rating',
        'emoji_reaction',
        'thumbs_up_down',
        'nps',
        'numeric_slider',
      ],
    },
    required: {
      type: Boolean,
      default: false,
    },
    // Options for multiple_choice and ranking
    options: [{ type: String }],
    // Likert scale configuration
    likertConfig: {
      min: { type: Number, default: 1 },
      max: { type: Number, default: 5 },
      minLabel: { type: String, default: 'Strongly Disagree' },
      maxLabel: { type: String, default: 'Strongly Agree' },
    },
    // Rubric criteria
    rubricCriteria: [rubricCriterionSchema],
    // Numeric slider configuration
    sliderConfig: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 100 },
      step: { type: Number, default: 1 },
      minLabel: { type: String, default: '' },
      maxLabel: { type: String, default: '' },
    },
    // Conditional/branching logic
    conditionalLogic: conditionalLogicSchema,
  },
  { _id: false }
);

// Main FeedbackForm schema
const feedbackFormSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Form title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      default: null, // null = applies to all courses
    },
    formType: {
      type: String,
      enum: ['micro', 'macro'],
      default: 'macro',
    },
    questions: {
      type: [questionSchema],
      validate: {
        validator: (v) => v.length > 0,
        message: 'Form must have at least one question',
      },
    },
    triggerType: {
      type: String,
      enum: [
        'manual',
        'lesson_complete',
        'course_complete',
        'time_interval',
        'exit_intent',
        'instructor_prompt',
      ],
      default: 'manual',
    },
    triggerConfig: {
      // For time_interval: interval in days
      intervalDays: { type: Number },
      // For lesson_complete: specific lesson IDs (empty = all lessons)
      lessonIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

feedbackFormSchema.index({ courseId: 1, isActive: 1 });
feedbackFormSchema.index({ triggerType: 1, isActive: 1 });

module.exports = mongoose.model('FeedbackForm', feedbackFormSchema);
