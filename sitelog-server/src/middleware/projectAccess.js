import Project from '../models/Project.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';

export const getProjectOrFail = catchAsync(async (req, res, next) => {
  const project = await Project.findOne({ _id: req.params.id, isDeleted: false })
    .populate('team.user', 'name email role avatar');

  if (!project) {
    return next(new AppError('Project not found.', 404));
  }

  const isTeamMember =
    project.team.some((m) => {
      const uid = m.user?._id?.toString?.() || m.user?.toString?.();
      return uid === req.user._id.toString();
    }) ||
    ['SuperAdmin', 'admin'].includes(req.user.role);

  const sameOrg = project.organisation?.toString() === req.user.organisation?.toString();
  const isGlobalManager = ['SuperAdmin', 'admin', 'owner', 'Owner'].includes(req.user.role);

  if (!isTeamMember && !sameOrg) {
    return next(new AppError('Not authorized for this project.', 403));
  }
  if (!isTeamMember && sameOrg && !isGlobalManager) {
    return next(new AppError('Not authorized for this project.', 403));
  }

  req.project = project;
  next();
});

export async function recalcProjectProgress(projectId) {
  const Milestone = (await import('../models/Milestone.js')).default;
  const milestones = await Milestone.find({ project: projectId });
  if (!milestones.length) return;
  const completed = milestones.filter((m) => m.status === 'completed');
  const progress = Math.round(
    completed.reduce((sum, m) => sum + (m.weightage || 0), 0)
  );
  await Project.findByIdAndUpdate(projectId, { progress: Math.min(progress, 100) });
}

export async function recalcBudgetSpent(projectId) {
  const Expense = (await import('../models/Expense.js')).default;
  const Project = (await import('../models/Project.js')).default;
  const expenses = await Expense.find({ project: projectId });
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);

  const project = await Project.findById(projectId);
  if (!project) return;

  const categoryTotals = {};
  expenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });

  const categoryMap = {
    material: 'Materials',
    labour: 'Labour',
    equipment: 'Equipment',
    overhead: 'Overhead',
    other: 'Contingency',
  };

  if (project.budgetCategories?.length) {
    project.budgetCategories = project.budgetCategories.map((cat) => {
      const key = Object.entries(categoryMap).find(([, v]) => v === cat.name)?.[0];
      return { ...cat.toObject?.() || cat, spent: key ? (categoryTotals[key] || 0) : cat.spent };
    });
    await project.save();
  }

  return totalSpent;
}
