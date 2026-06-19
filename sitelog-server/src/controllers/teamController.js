import User, { ROLE_LABELS } from '../models/User.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

/**
 * GET /api/v1/team/members
 */
export const listMembers = catchAsync(async (req, res) => {
  const members = await User.find({ organisation: req.user.organisation })
    .select('name email role roleLabel isActive lastSeen joinedAt avatar avatarUrl provider')
    .sort({ joinedAt: -1 })
    .lean();

  const Project = (await import('../models/Project.js')).default;
  const projects = await Project.find({ organisation: req.user.organisation, isDeleted: false });

  // Map each user to the projects they belong to
  const membersWithProjects = members.map(m => {
    const userProjects = projects.filter(p => p.team && p.team.some(t => t && t.user && t.user.toString() === m._id.toString()));
    return {
      ...m,
      projects: userProjects.map(p => ({ id: p._id, name: p.name }))
    };
  });

  res.json({ success: true, data: membersWithProjects });
});

/**
 * GET /api/v1/team/members/:id
 */
export const getMember = catchAsync(async (req, res) => {
  const member = await User.findById(req.params.id)
    .select('name email role roleLabel isActive lastSeen joinedAt avatar avatarUrl');

  if (!member) throw new AppError('Member not found.', 404);
  res.json({ success: true, data: member });
});

/**
 * PATCH /api/v1/team/members/:id/role
 */
export const changeRole = catchAsync(async (req, res) => {
  const { role } = req.body;
  const validRoles = ['site_engineer', 'accounts', 'owner', 'project_manager', 'admin', 'contractor'];
  if (!validRoles.includes(role)) {
    throw new AppError(`Invalid role. Must be one of: ${validRoles.join(', ')}`, 400);
  }

  const roleLabel = ROLE_LABELS[role];
  const member = await User.findByIdAndUpdate(
    req.params.id,
    { role, roleLabel },
    { new: true, runValidators: true }
  ).select('name email role roleLabel isActive');

  if (!member) throw new AppError('Member not found.', 404);
  res.json({ success: true, data: member });
});

/**
 * PATCH /api/v1/team/members/:id/deactivate
 */
export const deactivateMember = catchAsync(async (req, res) => {
  const member = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  ).select('name email role isActive');

  if (!member) throw new AppError('Member not found.', 404);
  res.json({ success: true, message: `${member.name} has been deactivated.`, data: member });
});

/**
 * DELETE /api/v1/team/members/:id
 */
export const deleteMember = catchAsync(async (req, res) => {
  const member = await User.findByIdAndDelete(req.params.id);
  if (!member) throw new AppError('Member not found.', 404);
  res.json({ success: true, message: `${member.name} has been permanently deleted.` });
});
