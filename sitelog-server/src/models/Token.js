import mongoose from 'mongoose';

const tokenSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    token: { type: String, required: true }, // Stored as SHA-256 hash
    type: {
      type: String,
      enum: ['email_verification', 'password_reset', 'invite'],
      required: true,
    },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
    usedAt: Date,
  },
  { timestamps: true }
);

// Only allow one active token of each type per user
tokenSchema.index({ userId: 1, type: 1 });

export default mongoose.model('Token', tokenSchema);
