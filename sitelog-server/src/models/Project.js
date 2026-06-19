import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, maxlength: 100, trim: true },
    description: { type: String, maxlength: 500 },
    organisation: { type: mongoose.Schema.Types.ObjectId, ref: 'Organisation', required: true, index: true },
    status: { type: String, enum: ['planning', 'active', 'onHold', 'completed'], default: 'active' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    location: {
      address: String,
      city: String,
      state: String,
      lat: Number,
      lng: Number,
    },
    coverPhoto: String,
    totalBudget: { type: Number, required: true, min: 0 },
    budgetCategories: [
      { name: String, allocated: { type: Number, default: 0 }, spent: { type: Number, default: 0 } },
    ],
    currency: { type: String, default: 'INR' },
    team: [{ 
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
      role: String,
      invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }],
    shareToken: String,
    progress: { type: Number, default: 0, min: 0, max: 100 },
    photos: [{ 
      url: String, 
      uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
      uploadedAt: { type: Date, default: Date.now } 
    }],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

projectSchema.index({ organisation: 1, isDeleted: 1 });

export default mongoose.model('Project', projectSchema);
