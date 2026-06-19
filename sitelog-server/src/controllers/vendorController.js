import Vendor from '../models/Vendor.js';
import Expense from '../models/Expense.js';
import SiteLog from '../models/SiteLog.js';
import Project from '../models/Project.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { recalcBudgetSpent } from '../middleware/projectAccess.js';

export const listVendors = catchAsync(async (req, res) => {
  const vendors = await Vendor.find({ organisation: req.user.organisation }).sort('name');
  res.json({ success: true, data: vendors });
});

export const createVendor = catchAsync(async (req, res) => {
  const { name, category, contact, email } = req.body;
  if (!name) throw new AppError('Vendor name required.', 400);
  const vendor = await Vendor.create({
    organisation: req.user.organisation,
    name,
    category,
    contact,
    email,
  });
  res.status(201).json({ success: true, data: vendor });
});

export const updateVendor = catchAsync(async (req, res) => {
  const vendor = await Vendor.findOneAndUpdate(
    { _id: req.params.vId, organisation: req.user.organisation },
    req.body,
    { new: true }
  );
  if (!vendor) throw new AppError('Vendor not found.', 404);
  res.json({ success: true, data: vendor });
});

export const deleteVendor = catchAsync(async (req, res) => {
  const vendor = await Vendor.findOneAndDelete({
    _id: req.params.vId,
    organisation: req.user.organisation,
  });
  if (!vendor) throw new AppError('Vendor not found.', 404);
  res.json({ success: true, message: 'Vendor deleted.' });
});

export const addVendorSpend = catchAsync(async (req, res) => {
  const { projectId, amount, deliveryRent, materials, date } = req.body;
  if (!projectId || !amount) throw new AppError('Project and amount are required.', 400);

  const vendor = await Vendor.findOne({ _id: req.params.vId, organisation: req.user.organisation });
  if (!vendor) throw new AppError('Vendor not found.', 404);

  const project = await Project.findById(projectId);
  if (!project) throw new AppError('Project not found.', 404);

  const totalAmount = Number(amount) + (Number(deliveryRent) || 0);
  const spendDate = date || new Date().toISOString().split('T')[0];

  // 1. Record spend on vendor
  vendor.spends.push({ project: projectId, amount: Number(amount), deliveryRent: Number(deliveryRent) || 0, materials: materials || '', date: spendDate });
  vendor.totalSpend = (vendor.totalSpend || 0) + totalAmount;
  await vendor.save();

  // 2. Create expense in project budget
  await Expense.create({
    project: projectId,
    category: 'material',
    vendor: vendor.name,
    description: `Vendor Spend — ${materials || 'Materials'}${deliveryRent ? ` (incl. ₹${deliveryRent} delivery)` : ''}`,
    amount: totalAmount,
    invoiceDate: spendDate,
    addedBy: req.user._id,
  });
  await recalcBudgetSpent(projectId);

  // 3. Create material log entries
  const materialItems = (materials || '').split(',').map(m => m.trim()).filter(Boolean);
  const newMats = materialItems.map(name => ({
    name,
    qty: '1',
    unit: 'lot',
    supplier: vendor.name,
    price: Math.round(Number(amount) / Math.max(materialItems.length, 1)),
    recdAt: spendDate,
  }));

  const existingLog = await SiteLog.findOne({ project: projectId, date: { $gte: new Date(spendDate + 'T00:00:00'), $lte: new Date(spendDate + 'T23:59:59') } });
  if (existingLog) {
    existingLog.materials.push(...newMats);
    await existingLog.save();
  } else {
    await SiteLog.create({
      project: projectId,
      createdBy: req.user._id,
      date: spendDate,
      weather: 'sunny',
      activities: `Vendor Delivery: ${vendor.name} — ${materialItems.join(', ')}`,
      materials: newMats,
    });
  }

  res.status(201).json({ success: true, data: vendor });
});

