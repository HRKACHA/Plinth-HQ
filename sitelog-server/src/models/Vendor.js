import mongoose from 'mongoose';

const vendorSchema = new mongoose.Schema(
  {
    organisation: { type: mongoose.Schema.Types.ObjectId, ref: 'Organisation', required: true, index: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, enum: ['Materials', 'Labour', 'Equipment', 'Other'], default: 'Materials' },
    contact: String,
    email: String,
    pendingOrders: { type: Number, default: 0 },
    totalSpend: { type: Number, default: 0 },
    spends: [{
      project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
      amount: { type: Number, required: true },
      deliveryRent: { type: Number, default: 0 },
      materials: { type: String, default: '' },
      date: { type: Date, default: Date.now },
    }],
  },
  { timestamps: true }
);

export default mongoose.model('Vendor', vendorSchema);

