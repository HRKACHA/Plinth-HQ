import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    category: { type: String, required: true },
    vendor: { type: String, required: true, maxlength: 100 },
    description: { type: String, maxlength: 300 },
    amount: { type: Number, required: true, min: 0 },
    invoiceDate: { type: Date, required: true },
    receiptUrl: String,
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model('Expense', expenseSchema);
