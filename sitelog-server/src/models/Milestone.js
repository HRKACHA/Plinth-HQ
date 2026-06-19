import mongoose from 'mongoose';

const milestoneSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    title: { type: String, required: true, maxlength: 150 },
    description: { type: String, maxlength: 500 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    actualEnd: Date,
    status: { type: String, enum: ['planned', 'inProgress', 'delayed', 'completed'], default: 'planned' },
    weightage: { type: Number, default: 0, min: 0, max: 100 },
    ownerApproval: {
      required: { type: Boolean, default: false },
      approved: { type: Boolean, default: false },
      approvedAt: Date,
      signature: String,
    },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('Milestone', milestoneSchema);
