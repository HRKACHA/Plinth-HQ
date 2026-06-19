import mongoose from 'mongoose';

const equipmentSchema = new mongoose.Schema(
  {
    organisation: { type: mongoose.Schema.Types.ObjectId, ref: 'Organisation', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 150 },
    category: {
      type: String,
      enum: ['Excavator', 'Crane', 'Loader', 'Mixer', 'Scaffolding', 'Truck', 'Generator', 'Compactor', 'Tools', 'Other'],
      default: 'Other',
    },
    type: { type: String, enum: ['Owned', 'Rented'], default: 'Owned' },
    serialNumber: { type: String, trim: true, maxlength: 80, default: '' },
    assignedProject: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
    status: {
      type: String,
      enum: ['Active', 'Idle', 'Under Maintenance', 'Retired'],
      default: 'Idle',
    },
    condition: {
      type: String,
      enum: ['Excellent', 'Good', 'Fair', 'Poor'],
      default: 'Good',
    },
    // Owned fields
    purchaseDate: { type: Date, default: null },
    purchaseCost: { type: Number, default: 0, min: 0 },
    // Rental fields
    dailyRate: { type: Number, default: 0, min: 0 },
    rentalVendor: { type: String, trim: true, maxlength: 100, default: '' },
    rentalStartDate: { type: Date, default: null },
    rentalEndDate: { type: Date, default: null },
    // Maintenance
    nextMaintenanceDate: { type: Date, default: null },
    notes: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { timestamps: true }
);

equipmentSchema.index({ organisation: 1, status: 1 });
equipmentSchema.index({ organisation: 1, assignedProject: 1 });

export default mongoose.model('Equipment', equipmentSchema);
