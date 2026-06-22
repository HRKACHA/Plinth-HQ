import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderName: { type: String, required: true },
    senderRole: { type: String, required: true },
    roleLabel: { type: String },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    room: { type: String, default: 'general', index: true },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    imageUrl: { type: String },
    edited: { type: Boolean, default: false },
    editedAt: { type: Date },
    deleted: { type: Boolean, default: false },
    // Chat Enhancement: Reply support
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
    // Chat Enhancement: @mentions
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

messageSchema.index({ room: 1, createdAt: -1 });

export default mongoose.model('Message', messageSchema);
