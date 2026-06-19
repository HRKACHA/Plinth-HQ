import jwt from 'jsonwebtoken';
import Project from '../models/Project.js';
import SiteLog from '../models/SiteLog.js';
import Milestone from '../models/Milestone.js';
import Expense from '../models/Expense.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';

export const getOwnerDashboard = catchAsync(async (req, res) => {
  let projectId;

  try {
    const decoded = jwt.verify(req.params.shareToken, process.env.JWT_SECRET);
    projectId = decoded.projectId;
  } catch {
    const project = await Project.findOne({ shareToken: req.params.shareToken, isDeleted: false });
    if (!project) throw new AppError('Invalid or expired share link.', 404);
    projectId = project._id;
  }

  const project = await Project.findById(projectId);
  if (!project || project.isDeleted) throw new AppError('Project not found.', 404);

  const [logs, milestones, expenseTotal] = await Promise.all([
    SiteLog.find({ project: projectId }).sort('-date').limit(7).populate('createdBy', 'name'),
    Milestone.find({ project: projectId }).sort('order'),
    Expense.aggregate([{ $match: { project: projectId } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
  ]);

  const spent = expenseTotal[0]?.total || 0;

  res.json({
    success: true,
    data: {
      project: {
        id: project._id,
        name: project.name,
        progress: project.progress,
        totalBudget: project.totalBudget,
        spent,
        burnRate: project.totalBudget ? Math.round((spent / project.totalBudget) * 100) : 0,
      },
      logs,
      milestones,
    },
  });
});
