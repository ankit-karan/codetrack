const mongoose = require('mongoose');

const revisionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      required: [true, 'problemId is required'],
    },
    revisionDate: {
      type: Date,
      required: [true, 'revisionDate is required'],
    },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    note: { type: String, default: '', trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

// Completing a revision stamps completedAt; reopening clears it.
revisionSchema.pre('save', function syncCompleted(next) {
  if (this.completed) {
    if (!this.completedAt) this.completedAt = new Date();
  } else {
    this.completedAt = null;
  }
  next();
});

revisionSchema.index({ userId: 1, revisionDate: 1 });
revisionSchema.index({ userId: 1, problemId: 1, completed: 1 });

module.exports = mongoose.model('Revision', revisionSchema);
