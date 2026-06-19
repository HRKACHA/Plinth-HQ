import Project from '../models/Project.js';
import SiteLog from '../models/SiteLog.js';
import Expense from '../models/Expense.js';
import Notification from '../models/Notification.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { generateShareToken } from '../utils/jwt.js';
import { recalcProjectProgress } from '../middleware/projectAccess.js';

function enrichProject(project, spent = 0) {
  const p = project.toObject ? project.toObject() : project;
  return {
    ...p,
    id: p._id,
    spent,
    teamCount: p.team?.length || 0,
    location: [p.location?.city, p.location?.state].filter(Boolean).join(', '),
  };
}

export const listProjects = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const isManager = ['PM', 'SuperAdmin', 'project_manager', 'admin', 'owner', 'Owner'].includes(req.user.role);
  const filter = { organisation: req.user.organisation, isDeleted: false };
  if (!isManager) {
    filter['team.user'] = req.user._id;
  }
  const [projects, total] = await Promise.all([
    Project.find(filter).sort('-updatedAt').skip(skip).limit(limit),
    Project.countDocuments(filter),
  ]);

  const enriched = await Promise.all(
    projects.map(async (p) => {
      const expenses = await Expense.aggregate([
        { $match: { project: p._id } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      const spent = expenses[0]?.total || 0;
      const lastLog = await SiteLog.findOne({ project: p._id }).sort('-date');
      return { ...enrichProject(p, spent), lastLogDate: lastLog?.date };
    })
  );

  res.json({
    success: true,
    data: enriched,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const createProject = catchAsync(async (req, res) => {
  const {
    name, description, startDate, endDate, totalBudget, location, coverPhoto, status,
  } = req.body;

  if (!name || !startDate || !endDate || totalBudget == null) {
    throw new AppError('Name, dates, and budget are required.', 400);
  }

  const shareToken = generateShareToken('temp');

  const project = await Project.create({
    name,
    description,
    organisation: req.user.organisation,
    startDate,
    endDate,
    totalBudget,
    location,
    coverPhoto,
    status: status || 'active',
    shareToken,
    budgetCategories: [
      { name: 'Materials', allocated: totalBudget * 0.4, spent: 0 },
      { name: 'Labour', allocated: totalBudget * 0.27, spent: 0 },
      { name: 'Equipment', allocated: totalBudget * 0.13, spent: 0 },
      { name: 'Overhead', allocated: totalBudget * 0.11, spent: 0 },
      { name: 'Contingency', allocated: totalBudget * 0.09, spent: 0 },
    ],
    team: [{ user: req.user._id, role: req.user.role }],
  });

  project.shareToken = generateShareToken(project._id.toString());
  await project.save();

  res.status(201).json({ success: true, data: enrichProject(project, 0) });
});

export const getProject = catchAsync(async (req, res) => {
  const project = req.project;
  const expenses = await Expense.aggregate([
    { $match: { project: project._id } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const lastLog = await SiteLog.findOne({ project: project._id }).sort('-date');
  res.json({
    success: true,
    data: { ...enrichProject(project, expenses[0]?.total || 0), lastLogDate: lastLog?.date },
  });
});

export const updateProject = catchAsync(async (req, res) => {
  const allowed = ['name', 'description', 'status', 'startDate', 'endDate', 'location', 'coverPhoto', 'totalBudget', 'progress'];
  const updates = {};
  allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

  const project = await Project.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  res.json({ success: true, data: enrichProject(project) });
});

export const deleteProject = catchAsync(async (req, res) => {
  await Project.findByIdAndUpdate(req.params.id, { isDeleted: true });
  res.json({ success: true, message: 'Project deleted.' });
});

export const getProjectStats = catchAsync(async (req, res) => {
  const projectId = req.project._id;
  const [logCount, expenseTotal, milestoneCount, docCount] = await Promise.all([
    SiteLog.countDocuments({ project: projectId }),
    Expense.aggregate([{ $match: { project: projectId } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    (await import('../models/Milestone.js')).default.countDocuments({ project: projectId }),
    (await import('../models/Document.js')).default.countDocuments({ project: projectId }),
  ]);

  res.json({
    success: true,
    data: {
      logCount,
      totalSpent: expenseTotal[0]?.total || 0,
      milestoneCount,
      docCount,
      progress: req.project.progress,
    },
  });
});

export const inviteTeamMember = catchAsync(async (req, res) => {
  const { userId, role } = req.body;
  const project = req.project;
  if (project.team.some((m) => m.user.toString() === userId)) {
    throw new AppError('User already on team.', 400);
  }
  project.team.push({ user: userId, role: role || 'Engineer' });
  await project.save();

  await Notification.create({
    recipient: userId,
    project: project._id,
    type: 'teamInvite',
    title: 'Added to Project',
    body: `You have been added to the project: ${project.name} by ${req.user.name}.`,
    link: `/projects/${project._id}`,
    channels: ['inApp']
  });

  res.json({ success: true, data: project });
});

export const refreshShareToken = catchAsync(async (req, res) => {
  const token = generateShareToken(req.project._id.toString());
  req.project.shareToken = token;
  await req.project.save();
  res.json({
    success: true,
    data: { shareLink: `${process.env.FRONTEND_URL}/owner/${token}` },
  });
});

export { recalcProjectProgress };
