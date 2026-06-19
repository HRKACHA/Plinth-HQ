import mongoose from 'mongoose';

const materialSchema = new mongoose.Schema(
  {
    organisation: { type: mongoose.Schema.Types.ObjectId, ref: 'Organisation', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 150 },
    category: {
      type: String,
      enum: ['Cement', 'Steel', 'Sand', 'Aggregate', 'Brick', 'Timber', 'Paint', 'Electrical', 'Plumbing', 'Other'],
      default: 'Other',
    },
    unit: {
      type: String,
      enum: ['bags', 'kg', 'ton', 'pieces', 'sqft', 'litres', 'cu.m', 'bundle', 'Other'],
      default: 'pieces',
    },
    currentStock: { type: Number, default: 0, min: 0 },
    minThreshold: { type: Number, default: 0, min: 0 },
    unitPrice: { type: Number, default: 0, min: 0 },
    supplier: { type: String, trim: true, maxlength: 100, default: '' },
    location: { type: String, trim: true, maxlength: 100, default: 'Central Warehouse' },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  },
  { timestamps: true }
);

materialSchema.index({ organisation: 1, name: 1 });
materialSchema.index({ organisation: 1, category: 1 });

export default mongoose.model('Material', materialSchema);
