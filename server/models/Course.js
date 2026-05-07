const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    courseName: {
      type: String,
      required: [true, 'Course name is required'],
      trim: true,
      unique: true,
      minlength: [3, 'Course name must be at least 3 characters'],
      maxlength: [100, 'Course name cannot exceed 100 characters'],
    },
    courseCode: {
      type: String,
      trim: true,
      uppercase: true,
    },
    facultyName: {
      type: String,
      required: [true, 'Faculty name is required'],
      trim: true,
      minlength: [2, 'Faculty name must be at least 2 characters'],
    },
    department: {
      type: String,
      trim: true,
      default: 'General',
    },
    semester: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      maxlength: [300, 'Description cannot exceed 300 characters'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Course', courseSchema);
