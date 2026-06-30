import crypto from 'crypto';
import InviteToken from '../models/InviteToken.js';
import User from '../models/User.js';
import Project from '../models/Project.js';
import Notification from '../models/Notification.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import { sendInviteEmail } from '../services/emailService.js';

const ROLE_LABEL_MAP = {
  site_engineer: 'Site Engineer (Can view and submit logs)',
  accounts: 'Accounts (Can view budget and expenses)',
  owner: 'Owner (View-only executive access)',
  project_manager: 'Project Manager (Full access)',
  admin: 'Admin',
  contractor: 'Contractor (Execution and daily logging)',
};

/**
 * POST /api/v1/invite/send
 * Send an invite email to a new team member.
 */
export const sendInvite = catchAsync(async (req, res) => {
  const { email, role, projectId } = req.body;

  if (!email || !role || !projectId) {
    throw new AppError('Email, role, and project are required.', 400);
  }

  const validRoles = ['site_engineer', 'accounts', 'owner', 'project_manager', 'admin', 'contractor'];
  if (!validRoles.includes(role)) {
    throw new AppError(`Invalid role. Must be one of: ${validRoles.join(', ')}`, 400);
  }

  const roleLabel = ROLE_LABEL_MAP[role];

  // Fetch project to get its name for the notification
  const project = await Project.findById(projectId);
  if (!project) throw new AppError('Project not found.', 404);

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  
  if (existingUser) {
    // Check if the user is already in this project's team
    const isAlreadyInTeam = project.team.some(member => member.user.toString() === existingUser._id.toString());
    if (isAlreadyInTeam) {
      throw new AppError('This user is already a member of this project.', 400);
    }
  }

  // Check if a valid unused invite already exists IN THIS PROJECT
  let existingInvite = await InviteToken.findOne({
    email: email.toLowerCase(),
    used: false,
    project: projectId,
    organisation: req.user.organisation,
    expiresAt: { $gt: new Date() },
  });

  let token;
  const baseUrl = process.env.BASE_URL || process.env.FRONTEND_URL || 'http://localhost:5173';

  if (existingInvite) {
    // Reuse existing invite
    token = existingInvite.token;
  } else {
    // Generate secure token
    token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await InviteToken.create({
      email: email.toLowerCase(),
      role,
      roleLabel,
      token,
      invitedBy: req.user._id,
      organisation: req.user.organisation,
      project: projectId,
      expiresAt,
    });
  }

  if (existingUser) {
    // Send an in-app notification to the existing user with a link to accept the invite
    await Notification.create({
      recipient: existingUser._id,
      project: project._id,
      type: 'teamInvite',
      title: 'Project Invitation',
      body: `${req.user.name} invited you to join the project "${project.name}" as a ${roleLabel}.`,
      link: `/invite/accept/${token}`,
      channels: ['inApp']
    });

    return res.status(200).json({
      success: true,
      message: `An invitation has been sent to ${existingUser.name}.`,
      data: { email, role, roleLabel, existingUser: true },
    });
  } else {
    // Send external email
    const inviteLink = `${baseUrl}/register?token=${token}`;
    try {
      await sendInviteEmail({
        to: email.toLowerCase(),
        inviteLink,
        role,
        roleLabel,
        invitedByName: req.user.name,
      });
    } catch (error) {
      console.error('Failed to send invite email:', error);
    }

    return res.status(201).json({
      success: true,
      message: 'Invite email sent successfully!',
      data: { email, role, roleLabel, inviteLink },
    });
  }
});

/**
 * POST /api/v1/invite/accept/:token
 * Accept a team invite for an already registered user.
 */
export const acceptInvite = catchAsync(async (req, res) => {
  const { token } = req.params;

  const invite = await InviteToken.findOne({
    token,
    used: false,
    expiresAt: { $gt: new Date() },
  });

  if (!invite) {
    throw new AppError('Invite token is invalid or has expired.', 400);
  }

  // Ensure the logged in user's email matches the invite (case insensitive)
  if (req.user.email.toLowerCase() !== invite.email.toLowerCase()) {
    throw new AppError('This invite was sent to a different email address.', 403);
  }

  if (!invite.project) {
    throw new AppError('This invite is corrupted or old. Please ask the admin to send a new invite.', 400);
  }

  const project = await Project.findById(invite.project);
  if (!project) {
    throw new AppError('Project not found.', 404);
  }

  const isAlreadyInTeam = project.team.some(member => member.user.toString() === req.user._id.toString());
  if (!isAlreadyInTeam) {
    project.team.push({
      user: req.user._id,
      role: invite.role,
      invitedBy: invite.invitedBy
    });
    await project.save();
  }

  invite.used = true;
  await invite.save();

  res.json({
    success: true,
    message: `You have successfully joined ${project.name}!`,
    data: { projectId: project._id }
  });
});

/**
 * GET /api/v1/invite/verify/:token
 * Verify an invite token (public — no auth required).
 */
export const verifyInvite = catchAsync(async (req, res) => {
  const invite = await InviteToken.findOne({
    token: req.params.token,
    used: false,
    expiresAt: { $gt: new Date() },
  });

  if (!invite) {
    return res.status(404).json({
      success: false,
      valid: false,
      message: 'Invalid or expired invite link.',
    });
  }

  res.json({
    success: true,
    valid: true,
    data: {
      email: invite.email,
      role: invite.role,
      roleLabel: invite.roleLabel,
    },
  });
});

/**
 * GET /api/v1/invite/list
 * List all invite tokens for the organisation.
 */
export const listInvites = catchAsync(async (req, res) => {
  const invites = await InviteToken.find({ organisation: req.user.organisation })
    .populate('invitedBy', 'name email')
    .sort({ createdAt: -1 })
    .lean();

  res.json({ success: true, data: invites });
});

/**
 * DELETE /api/v1/invite/:id
 * Revoke an unused invite.
 */
export const revokeInvite = catchAsync(async (req, res) => {
  const invite = await InviteToken.findById(req.params.id);
  if (!invite) throw new AppError('Invite not found.', 404);
  if (invite.used) throw new AppError('Cannot revoke an already-used invite.', 400);

  await InviteToken.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Invite revoked.' });
});
