import Message from '../models/Message.js';
import { ROLE_LABELS } from '../models/User.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

const DEFAULT_ROOMS = [];

/**
 * GET /api/v1/chat/messages
 */
export const getMessages = catchAsync(async (req, res) => {
  const { room = 'general', limit = 50, before } = req.query;

  const query = { room, deleted: false };
  if (before) {
    const beforeMsg = await Message.findById(before);
    if (beforeMsg) {
      query.createdAt = { $lt: beforeMsg.createdAt };
    }
  }

  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit, 10))
    .populate('sender', 'name role roleLabel avatar avatarUrl')
    .lean();

  // Check if there are more messages
  const oldestFetched = messages[messages.length - 1];
  let hasMore = false;
  if (oldestFetched) {
    const olderCount = await Message.countDocuments({
      room,
      deleted: false,
      createdAt: { $lt: oldestFetched.createdAt },
    });
    hasMore = olderCount > 0;
  }

  res.json({
    success: true,
    data: {
      messages: messages.reverse(), // Return in chronological order
      hasMore,
    },
  });
});

/**
 * POST /api/v1/chat/messages
 */
export const sendMessage = catchAsync(async (req, res) => {
  const { message, room = 'general' } = req.body;

  if (!message || !message.trim()) {
    throw new AppError('Message cannot be empty.', 400);
  }
  if (message.length > 2000) {
    throw new AppError('Message cannot exceed 2000 characters.', 400);
  }

  const newMessage = await Message.create({
    sender: req.user._id,
    senderName: req.user.name,
    senderRole: req.user.role,
    roleLabel: ROLE_LABELS[req.user.role] || req.user.roleLabel,
    message: message.trim(),
    room,
    readBy: [req.user._id],
  });

  const populated = await Message.findById(newMessage._id)
    .populate('sender', 'name role roleLabel avatar avatarUrl');

  res.status(201).json({ success: true, data: populated });
});

/**
 * PATCH /api/v1/chat/messages/:id/read
 */
export const markAsRead = catchAsync(async (req, res) => {
  const msg = await Message.findByIdAndUpdate(
    req.params.id,
    { $addToSet: { readBy: req.user._id } },
    { new: true }
  );

  if (!msg) throw new AppError('Message not found.', 404);
  res.json({ success: true, data: msg });
});

/**
 * GET /api/v1/chat/rooms
 */
export const getRooms = catchAsync(async (req, res) => {
  const Project = (await import('../models/Project.js')).default;
  const query = {
    organisation: req.user.organisation,
    isDeleted: false,
    'team.user': req.user._id
  };

  const activeProjects = await Project.find(query).select('name').lean();

  const ALL_ROOMS = activeProjects.map((p) => ({
    name: p._id.toString(),
    label: p.name,
    description: `Discussion for ${p.name}`,
  }));

  const rooms = await Promise.all(
    ALL_ROOMS.map(async (room) => {
      const lastMessage = await Message.findOne({ room: room.name, deleted: false })
        .sort({ createdAt: -1 })
        .select('message senderName createdAt')
        .lean();

      const unreadCount = await Message.countDocuments({
        room: room.name,
        deleted: false,
        readBy: { $ne: req.user._id },
      });

      return {
        ...room,
        lastMessage: lastMessage
          ? {
              text: lastMessage.message.substring(0, 60) + (lastMessage.message.length > 60 ? '...' : ''),
              sender: lastMessage.senderName,
              time: lastMessage.createdAt,
            }
          : null,
        unreadCount,
      };
    })
  );

  res.json({ success: true, data: rooms });
});

export const getRoomMembers = catchAsync(async (req, res) => {
  const { id } = req.params;
  const Project = (await import('../models/Project.js')).default;
  const project = await Project.findById(id)
    .populate('team.user', 'name email avatar avatarUrl isActive lastSeen')
    .populate('team.invitedBy', 'name email role')
    .lean();

  if (!project) throw new AppError('Room not found', 404);

  const members = project.team
    .filter(member => member && member.user)
    .map(member => ({
      userId: member.user._id,
      name: member.user.name,
      email: member.user.email,
      avatarUrl: member.user.avatarUrl || member.user.avatar,
      isActive: member.user.isActive,
      lastSeen: member.user.lastSeen,
      role: member.role,
      roleLabel: ROLE_LABELS[member.role] || member.role,
      invitedBy: member.invitedBy ? member.invitedBy.name : null
    }));

  res.json({ success: true, data: members });
});

export { DEFAULT_ROOMS };
