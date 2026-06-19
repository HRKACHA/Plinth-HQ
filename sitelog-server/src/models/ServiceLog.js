import mongoose from 'mongoose';

const serviceLogSchema = new mongoose.Schema(
  {
    equipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', required: true, index: true },
    organisation: { type: mongoose.Schema.Types.ObjectId, ref: 'Organisation', required: true, index: true },
    type: {
      type: String,
      enum: ['Routine Maintenance', 'Repair', 'Inspection', 'Breakdown'],
      required: true,
    },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    cost: { type: Number, default: 0, min: 0 },
    serviceDate: { type: Date, default: Date.now },
    nextDueDate: { type: Date, default: null },
    performedBy: { type: String, trim: true, maxlength: 100, default: '' },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

serviceLogSchema.index({ equipment: 1, serviceDate: -1 });

export default mongoose.model('ServiceLog', serviceLogSchema);
