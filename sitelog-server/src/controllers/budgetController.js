import Expense from '../models/Expense.js';
import Project from '../models/Project.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { recalcBudgetSpent } from '../middleware/projectAccess.js';
import { createNotification, notifyProjectTeam } from '../services/notifService.js';

export const getBudget = catchAsync(async (req, res) => {
  const project = req.project;
  const totalSpent = await recalcBudgetSpent(project._id) || 0;
  const refreshed = await Project.findById(project._id);

  const expenses = await Expense.find({ project: project._id }).sort('-invoiceDate').limit(50);

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthly = await Expense.aggregate([
    { $match: { project: project._id, invoiceDate: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: { year: { $year: '$invoiceDate' }, month: { $month: '$invoiceDate' } },
        actual: { $sum: '$amount' },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyBudget = monthly.map((m) => ({
    month: monthNames[m._id.month - 1],
    actual: m.actual,
    planned: Math.round(project.totalBudget / 12),
  }));

  const burnRate = project.totalBudget > 0 ? parseFloat(((totalSpent / project.totalBudget) * 100).toFixed(2)) : 0;

  res.json({
    success: true,
    data: {
      totalBudget: project.totalBudget,
      spent: totalSpent,
      remaining: project.totalBudget - totalSpent,
      burnRate,
      categories: refreshed.budgetCategories,
      monthlyBudget,
      expenses,
    },
  });
});

export const updateBudget = catchAsync(async (req, res) => {
  const { budgetCategories, totalBudget } = req.body;
  const updates = {};
  if (budgetCategories) updates.budgetCategories = budgetCategories;
  if (totalBudget != null) updates.totalBudget = totalBudget;

  const project = await Project.findByIdAndUpdate(req.params.id, updates, { new: true });
  res.json({ success: true, data: project });
});

export const listExpenses = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const [expenses, total] = await Promise.all([
    Expense.find({ project: req.params.id }).sort('-invoiceDate').skip((page - 1) * limit).limit(limit),
    Expense.countDocuments({ project: req.params.id }),
  ]);
  res.json({ success: true, data: expenses, pagination: { page, limit, total } });
});

export const createExpense = catchAsync(async (req, res) => {
  const { category, vendor, description, amount, invoiceDate, receiptUrl } = req.body;
  if (!category || !vendor || amount == null || !invoiceDate) {
    throw new AppError('Category, vendor, amount, and invoice date required.', 400);
  }

  const startOfDay = new Date(invoiceDate);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(invoiceDate);
  endOfDay.setUTCHours(23, 59, 59, 999);

  let expense = await Expense.findOne({
    project: req.params.id,
    vendor,
    description,
    invoiceDate: { $gte: startOfDay, $lte: endOfDay }
  });

  if (expense && expense.category === category) {
    expense.amount += amount;
    if (receiptUrl && !expense.receiptUrl) expense.receiptUrl = receiptUrl;
    await expense.save();
  } else {
    expense = await Expense.create({
      project: req.params.id,
      category,
      vendor,
      description,
      amount,
      invoiceDate,
      receiptUrl,
      addedBy: req.user._id,
    });
  }

  const totalSpent = await recalcBudgetSpent(req.params.id);
  const project = req.project;
  const pct = Math.round((totalSpent / project.totalBudget) * 100);

  const io = req.app.get('io');
  if (pct >= 80) {
    await notifyProjectTeam(io, project, {
      type: 'budgetAlert',
      title: 'Budget threshold reached',
      body: `Project budget has reached ${pct}% utilization`,
      link: `/projects/${project._id}/budget`,
    });
  }

  res.status(201).json({ success: true, data: expense });
});

export const approveExpense = catchAsync(async (req, res) => {
  const expense = await Expense.findOneAndUpdate(
    { _id: req.params.expId, project: req.params.id },
    { approvedBy: req.user._id, approvedAt: new Date() },
    { new: true }
  );
  if (!expense) throw new AppError('Expense not found.', 404);
  res.json({ success: true, data: expense });
});

export const deleteExpense = catchAsync(async (req, res) => {
  await Expense.deleteOne({ _id: req.params.expId, project: req.params.id });
  await recalcBudgetSpent(req.params.id);
  res.json({ success: true, message: 'Expense deleted.' });
});
