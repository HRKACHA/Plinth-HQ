import mongoose from 'mongoose';

const materialLogSchema = new mongoose.Schema(
  {
    material: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true, index: true },
    organisation: { type: mongoose.Schema.Types.ObjectId, ref: 'Organisation', required: true, index: true },
    type: { type: String, enum: ['inward', 'outward', 'transfer'], required: true },
    qty: { type: Number, required: true, min: 0.01 },
    fromProject: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
    toProject: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
    vendor: { type: String, trim: true, maxlength: 100, default: '' },
    notes: { type: String, trim: true, maxlength: 500, default: '' },
    date: { type: Date, default: Date.now },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

materialLogSchema.index({ material: 1, date: -1 });

export default mongoose.model('MaterialLog', materialLogSchema);
