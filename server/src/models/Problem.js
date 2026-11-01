const mongoose = require('mongoose');
const {
  DIFFICULTIES,
  STATUSES,
  PLATFORMS,
  PROGRAMMING_LANGUAGES,
  TOPICS,
} = require('../utils/constants');

const URL_REGEX = /^https?:\/\/\S+$/i;

const problemSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Question title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    platform: {
      type: String,
      enum: { values: PLATFORMS, message: 'Platform must be LeetCode, GeeksforGeeks, CodeStudio or Other' },
      default: 'LeetCode',
    },
    problemUrl: {
      type: String,
      default: '',
      trim: true,
      validate: {
        validator: (v) => !v || URL_REGEX.test(v),
        message: 'Problem URL must be a valid http(s) URL',
      },
    },
    topic: {
      type: String,
      required: [true, 'Topic is required'],
      enum: { values: TOPICS, message: 'Topic is not a supported DSA topic' },
    },
    difficulty: {
      type: String,
      enum: { values: DIFFICULTIES, message: 'Difficulty must be Easy, Medium or Hard' },
      default: 'Medium',
    },
    status: {
      type: String,
      enum: { values: STATUSES, message: 'Status must be Solved, Attempted or Unsolved' },
      default: 'Unsolved',
    },
    timeComplexity: { type: String, default: '', trim: true, maxlength: 60 },
    spaceComplexity: { type: String, default: '', trim: true, maxlength: 60 },
    notes: { type: String, default: '', trim: true, maxlength: 5000 },
    programmingLanguage: {
      type: String,
      enum: { values: PROGRAMMING_LANGUAGES, message: 'Unsupported programming language' },
      default: 'C++',
    },
    solvedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Keep `solvedAt` consistent with `status` no matter how the document is written.
problemSchema.pre('save', function syncSolvedAt(next) {
  if (this.status === 'Solved') {
    if (!this.solvedAt) this.solvedAt = new Date();
  } else {
    this.solvedAt = null;
  }
  next();
});

// Indexes aligned with the query patterns of the API.
problemSchema.index({ userId: 1, createdAt: -1 });
problemSchema.index({ userId: 1, status: 1 });
problemSchema.index({ userId: 1, topic: 1, status: 1 });
problemSchema.index({ userId: 1, difficulty: 1 });
problemSchema.index({ userId: 1, solvedAt: -1 });
problemSchema.index({ userId: 1, title: 1 });

module.exports = mongoose.model('Problem', problemSchema);
