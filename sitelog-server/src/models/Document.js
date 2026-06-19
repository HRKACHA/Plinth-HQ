import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['drawing', 'contract', 'permit', 'BOQ', 'inspection', 'other'], default: 'other' },
    fileUrl: { type: String, required: true },
    fileSize: Number,
    mimeType: String,
    version: { type: Number, default: 1 },
    versions: [{ url: String, version: Number, uploadedAt: Date, uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } }],
    tags: [String],
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.model('Document', documentSchema);
