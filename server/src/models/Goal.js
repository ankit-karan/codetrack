const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    dailyTarget: {
      type: Number,
      required: [true, 'dailyTarget is required'],
      min: [1, 'dailyTarget must be at least 1'],
      max: [50, 'dailyTarget cannot exceed 50'],
    },
    weeklyTarget: {
      type: Number,
      required: [true, 'weeklyTarget is required'],
      min: [1, 'weeklyTarget must be at least 1'],
      max: [350, 'weeklyTarget cannot exceed 350'],
    },
    startDate: { type: Date, required: [true, 'startDate is required'] },
    endDate: { type: Date, required: [true, 'endDate is required'] },
    // Exactly one active goal per user (enforced by the partial unique index below).
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

goalSchema.pre('validate', function validateRange(next) {
  if (this.startDate && this.endDate && this.startDate > this.endDate) {
    this.invalidate('endDate', 'endDate must be on or after startDate');
  }
  next();
});

goalSchema.index(
  { userId: 1 },
  { unique: true, partialFilterExpression: { active: true } }
);
goalSchema.index({ userId: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model('Goal', goalSchema);
