import Milestone from '../models/Milestone.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { recalcProjectProgress } from '../middleware/projectAccess.js';
import { notifyProjectTeam } from '../services/notifService.js';

export const listMilestones = catchAsync(async (req, res) => {
  const milestones = await Milestone.find({ project: req.params.id })
    .populate('assignee', 'name avatar')
    .sort('order');
  res.json({ success: true, data: milestones });
});

export const createMilestone = catchAsync(async (req, res) => {
  const { title, description, startDate, endDate, weightage, assignee, status } = req.body;
  if (!title || !startDate || !endDate) throw new AppError('Title and dates required.', 400);

  const count = await Milestone.countDocuments({ project: req.params.id });
  const milestone = await Milestone.create({
    project: req.params.id,
    title,
    description,
    startDate,
    endDate,
    weightage: weightage || 0,
    assignee,
    status: status || 'planned',
    order: count,
    ownerApproval: { required: true },
  });

  await recalcProjectProgress(req.params.id);
  res.status(201).json({ success: true, data: milestone });
});

export const updateMilestone = catchAsync(async (req, res) => {
  const milestone = await Milestone.findOne({ _id: req.params.mId, project: req.params.id });
  if (!milestone) throw new AppError('Milestone not found.', 404);

  const allowed = ['title', 'description', 'startDate', 'endDate', 'status', 'weightage', 'assignee'];
  allowed.forEach((k) => { if (req.body[k] !== undefined) milestone[k] = req.body[k]; });

  if (req.body.status === 'completed') milestone.actualEnd = new Date();
  if (new Date() > milestone.endDate && milestone.status === 'inProgress') {
    milestone.status = 'delayed';
    const io = req.app.get('io');
    await notifyProjectTeam(io, req.project, {
      type: 'milestoneDelay',
      title: 'Milestone delayed',
      body: `${milestone.title} is past due date`,
      link: `/projects/${req.params.id}/milestones`,
    });
  }

  await milestone.save();
  await recalcProjectProgress(req.params.id);
  res.json({ success: true, data: milestone });
});

export const deleteMilestone = catchAsync(async (req, res) => {
  await Milestone.deleteOne({ _id: req.params.mId, project: req.params.id });
  await recalcProjectProgress(req.params.id);
  res.json({ success: true, message: 'Milestone deleted.' });
});

export const approveMilestone = catchAsync(async (req, res) => {
  const milestone = await Milestone.findOne({ _id: req.params.mId, project: req.params.id });
  if (!milestone) throw new AppError('Milestone not found.', 404);

  milestone.ownerApproval.approved = true;
  milestone.ownerApproval.approvedAt = new Date();
  milestone.ownerApproval.signature = req.body.signature || 'digital-signature';
  milestone.status = 'completed';
  milestone.actualEnd = new Date();
  await milestone.save();
  await recalcProjectProgress(req.params.id);

  res.json({ success: true, data: milestone });
});
