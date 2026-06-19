import Issue from '../models/Issue.js';
import Notification from '../models/Notification.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

export const listIssues = catchAsync(async (req, res) => {
  const issues = await Issue.find({ project: req.params.id })
    .populate('assignedTo', 'name email avatar role')
    .populate('createdBy', 'name email avatar role')
    .sort({ createdAt: -1 });
  
  res.status(200).json({ success: true, count: issues.length, data: issues });
});

export const createIssue = catchAsync(async (req, res) => {
  const issue = await Issue.create({
    ...req.body,
    project: req.params.id,
    createdBy: req.user._id
  });
  
  const populatedIssue = await Issue.findById(issue._id)
    .populate('assignedTo', 'name email avatar role')
    .populate('createdBy', 'name email avatar role');

  if (issue.assignedTo && issue.assignedTo.toString() !== req.user._id.toString()) {
    await Notification.create({
      recipient: issue.assignedTo,
      project: req.params.id,
      type: 'issueAssigned',
      title: 'New Issue Assigned',
      body: `You have been assigned to issue: ${issue.title}`,
      link: `/projects/${req.params.id}/issues`,
      channels: ['inApp']
    });
  }

  res.status(201).json({ success: true, data: populatedIssue });
});

export const getIssue = catchAsync(async (req, res, next) => {
  const issue = await Issue.findOne({ _id: req.params.issueId, project: req.params.id })
    .populate('assignedTo', 'name email avatar role')
    .populate('createdBy', 'name email avatar role');
    
  if (!issue) return next(new AppError('Issue not found', 404));
  res.status(200).json({ success: true, data: issue });
});

export const updateIssue = catchAsync(async (req, res, next) => {
  const existingIssue = await Issue.findOne({ _id: req.params.issueId, project: req.params.id });
  if (!existingIssue) return next(new AppError('Issue not found', 404));

  const isCreator = existingIssue.createdBy.toString() === req.user._id.toString();
  const isManager = ['admin', 'project_manager', 'PM', 'SuperAdmin', 'owner', 'Owner'].includes(req.user.role);
  
  // Restricted access logic
  const updates = { ...req.body };
  if (!isCreator && !isManager) {
    if (existingIssue.assignedTo?.toString() === req.user._id.toString()) {
      // They are the assigned user, they can only update status and photos
      delete updates.title;
      delete updates.description;
      delete updates.priority;
      delete updates.assignedTo;
      delete updates.dueDate;
    } else {
      return next(new AppError('You do not have permission to edit this issue.', 403));
    }
  }

  const issue = await Issue.findOneAndUpdate(
    { _id: req.params.issueId, project: req.params.id },
    updates,
    { new: true, runValidators: true }
  ).populate('assignedTo', 'name email avatar role').populate('createdBy', 'name email avatar role');

  // Check if assignedTo changed to a new user
  if (
    updates.assignedTo && 
    updates.assignedTo.toString() !== existingIssue.assignedTo?.toString() &&
    updates.assignedTo.toString() !== req.user._id.toString()
  ) {
    await Notification.create({
      recipient: updates.assignedTo,
      project: req.params.id,
      type: 'issueAssigned',
      title: 'Issue Re-assigned',
      body: `You have been assigned to an existing issue: ${issue.title}`,
      link: `/projects/${req.params.id}/issues`,
      channels: ['inApp']
    });
  }

  res.status(200).json({ success: true, data: issue });
});

export const deleteIssue = catchAsync(async (req, res, next) => {
  const issue = await Issue.findOneAndDelete({ _id: req.params.issueId, project: req.params.id });
  if (!issue) return next(new AppError('Issue not found', 404));
  res.status(200).json({ success: true, data: {} });
});
