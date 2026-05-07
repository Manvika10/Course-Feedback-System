const mongoose = require('mongoose');

// Pseudonym generator (shared logic)
const ADJECTIVES = [
  'Curious', 'Bright', 'Bold', 'Calm', 'Clever', 'Eager', 'Fair', 'Gentle',
  'Happy', 'Kind', 'Lively', 'Merry', 'Noble', 'Quick', 'Sharp', 'Wise',
];

const ANIMALS = [
  'Panda', 'Falcon', 'Dolphin', 'Fox', 'Owl', 'Tiger', 'Eagle', 'Wolf',
  'Bear', 'Hawk', 'Lion', 'Raven', 'Deer', 'Koala', 'Lynx', 'Otter',
];

function generatePseudonym() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const num = Math.floor(Math.random() * 99) + 1;
  return `${adj} ${animal} #${num}`;
}

const feedbackSchema = new mongoose.Schema(
  {
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
    // NEW: Optional lesson reference for micro-ratings
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      default: null,
    },
    // NEW: Feedback type — micro (per-lesson) or macro (end-of-course)
    feedbackType: {
      type: String,
      enum: ['micro', 'macro'],
      default: 'macro',
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [500, 'Comment cannot exceed 500 characters'],
      default: '',
    },
    // UPDATED: Identity mode replaces simple boolean
    anonymous: {
      type: Boolean,
      default: false,
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
    // Detailed ratings breakdown (optional)
    teachingQuality: {
      type: Number,
      min: 1,
      max: 5,
    },
    courseContent: {
      type: Number,
      min: 1,
      max: 5,
    },
    overallSatisfaction: {
      type: Number,
      min: 1,
      max: 5,
    },
    // NEW: Emoji reaction
    emojiReaction: {
      type: String,
      enum: ['angry', 'sad', 'neutral', 'happy', 'love', null],
      default: null,
    },
    // NEW: Thumbs up/down
    thumbsUpDown: {
      type: String,
      enum: ['up', 'down', null],
      default: null,
    },
    // NEW: NPS Score (0-10)
    npsScore: {
      type: Number,
      min: 0,
      max: 10,
      default: null,
    },
    // NEW: Numeric slider ratings (flexible key-value)
    sliderRatings: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate pseudonym and sync anonymous flag
feedbackSchema.pre('save', function (next) {
  if (this.identityMode === 'pseudonymous' && !this.pseudonym) {
    this.pseudonym = generatePseudonym();
  }
  if (this.identityMode === 'anonymous') {
    this.anonymous = true;
    this.pseudonym = null;
  } else if (this.identityMode === 'identified') {
    this.anonymous = false;
    this.pseudonym = null;
  }
  next();
});

// UPDATED compound index: allows both micro and macro feedback per student per course
feedbackSchema.index(
  { studentId: 1, courseId: 1, lessonId: 1, feedbackType: 1 },
  { unique: true }
);

module.exports = mongoose.model('Feedback', feedbackSchema);
