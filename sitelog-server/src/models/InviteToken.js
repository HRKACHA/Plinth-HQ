import mongoose from 'mongoose';

const inviteTokenSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true },
    role: {
      type: String,
      enum: ['site_engineer', 'accounts', 'owner', 'project_manager', 'admin', 'contractor'],
      required: true,
    },
    roleLabel: { type: String, required: true },
    token: { type: String, required: true, unique: true },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    organisation: { type: mongoose.Schema.Types.ObjectId, ref: 'Organisation' },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    used: { type: Boolean, default: false },
    usedAt: { type: Date },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

inviteTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('InviteToken', inviteTokenSchema);
