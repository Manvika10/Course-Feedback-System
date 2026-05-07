const mongoose = require('mongoose');

// Pseudonym generator
const ADJECTIVES = [
  'Curious', 'Bright', 'Bold', 'Calm', 'Clever', 'Eager', 'Fair', 'Gentle',
  'Happy', 'Kind', 'Lively', 'Merry', 'Noble', 'Quick', 'Sharp', 'Wise',
  'Brave', 'Vivid', 'Witty', 'Daring', 'Keen', 'Swift', 'Warm', 'Jolly',
];

const ANIMALS = [
  'Panda', 'Falcon', 'Dolphin', 'Fox', 'Owl', 'Tiger', 'Eagle', 'Wolf',
  'Bear', 'Hawk', 'Lion', 'Raven', 'Deer', 'Koala', 'Lynx', 'Otter',
  'Crane', 'Heron', 'Moth', 'Wren', 'Finch', 'Lark', 'Swan', 'Dove',
];

function generatePseudonym() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const num = Math.floor(Math.random() * 99) + 1;
  return `${adj} ${animal} #${num}`;
}

// Sub-schema for individual question answers
const answerSchema = new mongoose.Schema(
  {
    questionIndex: {
      type: Number,
      required: true,
    },
    questionType: {
      type: String,
      required: true,
    },
    // Mixed type to support different answer formats:
    // free_text -> String
    // multiple_choice -> String
    // ranking -> [String] (ordered)
    // likert -> Number
    // rubric -> [{ criterion: String, score: Number }]
    // star_rating -> Number (1-5)
    // emoji_reaction -> String (emoji key)
    // thumbs_up_down -> String ('up' | 'down')
    // nps -> Number (0-10)
    // numeric_slider -> Number
    answer: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  { _id: false }
);

const feedbackResponseSchema = new mongoose.Schema(
  {
    formId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeedbackForm',
      required: [true, 'Form ID is required'],
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      default: null,
    },
    answers: {
      type: [answerSchema],
      validate: {
        validator: (v) => v.length > 0,
        message: 'At least one answer is required',
      },
    },
    identityMode: {
      type: String,
      enum: ['identified', 'anonymous', 'pseudonymous'],
      default: 'identified',
    },
    pseudonym: {
      type: String,
      default: null,
    },
    triggerSource: {
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
  },
  {
    timestamps: true,
  }
);

// Auto-generate pseudonym for pseudonymous submissions
feedbackResponseSchema.pre('save', function (next) {
  if (this.identityMode === 'pseudonymous' && !this.pseudonym) {
    this.pseudonym = generatePseudonym();
  }
  if (this.identityMode === 'anonymous') {
    this.pseudonym = null;
  }
  next();
});

// Prevent duplicate submissions per student per form per lesson
feedbackResponseSchema.index(
  { studentId: 1, formId: 1, lessonId: 1 },
  { unique: true }
);

module.exports = mongoose.model('FeedbackResponse', feedbackResponseSchema);
