import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    type: { type: String, enum: ['newLog', 'budgetAlert', 'milestoneDelay', 'ownerComment', 'approval', 'issueAssigned', 'teamInvite'], required: true },
    title: { type: String, maxlength: 100, required: true },
    body: { type: String, maxlength: 300 },
    link: String,
    isRead: { type: Boolean, default: false },
    channels: [{ type: String, enum: ['inApp', 'email', 'sms'] }],
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model('Notification', notificationSchema);
