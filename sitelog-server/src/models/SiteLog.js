import mongoose from 'mongoose';

const siteLogSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    date: { type: Date, required: true },
    weather: { type: String, enum: ['sunny', 'cloudy', 'rainy', 'stormy', 'foggy'], default: 'sunny' },
    temperature: Number,
    activities: { type: String, required: true, maxlength: 3000 },
    remarks: { type: String, maxlength: 1000 },
    photos: [{ url: String, caption: String, uploadedAt: { type: Date, default: Date.now } }],
    labour: [{ trade: String, present: { type: Number, default: 0 }, absent: { type: Number, default: 0 }, wagePerDay: { type: Number, default: 0 } }],
    materials: [{ name: String, qty: String, unit: String, supplier: String, price: Number, recdAt: Date }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isLocked: { type: Boolean, default: false },
    lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

siteLogSchema.index({ project: 1, date: 1 }, { unique: true });

export default mongoose.model('SiteLog', siteLogSchema);
