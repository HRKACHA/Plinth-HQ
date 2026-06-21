import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env'), override: true });

import http from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import cron from 'node-cron';
import connectDB from './config/db.js';
import app from './app.js';
import { autoLockOldLogs } from './controllers/logController.js';
import { processEquipmentRentals } from './controllers/equipmentController.js';
import { seedDatabase } from './seedData.js';
import Message from './models/Message.js';
import User from './models/User.js';
import { ROLE_LABELS } from './models/User.js';

const PORT = process.env.PORT || 5000;

await connectDB();

const count = await User.countDocuments();
if (count === 0) {
  console.log('Empty database — seeding demo data...');
  await seedDatabase({ clear: false });
}

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
});

// ── Online Users Map ──
const onlineUsers = new Map(); // socketId → { userId, name, role }

// ── Socket.io Authentication Middleware ──
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication error: No token provided'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch {
    next(new Error('Authentication error: Invalid token'));
  }
});

// ── Socket.io Events ──
io.on('connection', async (socket) => {
  const userId = socket.user.id;

  // Fetch full user data for the socket
  const dbUser = await User.findById(userId).select('name role roleLabel');
  if (!dbUser) {
    socket.disconnect(true);
    return;
  }

  const userData = {
    userId,
    name: dbUser.name,
    role: dbUser.role,
    roleLabel: dbUser.roleLabel || ROLE_LABELS[dbUser.role],
  };

  // Register online
  onlineUsers.set(socket.id, userData);
  socket.join(`user-${userId}`);

  // Notify all clients
  io.emit('user:online', {
    userId: userData.userId,
    name: userData.name,
    role: userData.role,
    onlineCount: onlineUsers.size,
  });

  console.log(`[Socket] ${userData.name} connected (${onlineUsers.size} online)`);

  // ── Legacy project events (kept for backwards compatibility) ──
  socket.on('join:project', (projectId) => socket.join(`project:${projectId}`));
  socket.on('leave:project', (projectId) => socket.leave(`project:${projectId}`));

  // ── Chat: Join Room ──
  socket.on('join-room', ({ room }) => {
    socket.join(room);
    socket.emit('room:joined', { room });
  });

  // ── Chat: Leave Room ──
  socket.on('leave-room', ({ room }) => {
    socket.leave(room);
  });

  // ── Chat: Send Message ──
  socket.on('send-message', async ({ message, room = 'general', imageUrl }) => {
    if (!message || !message.trim()) return;
    if (message.length > 2000) return;

    try {
      const newMsg = await Message.create({
        sender: userId,
        senderName: userData.name,
        senderRole: userData.role,
        roleLabel: userData.roleLabel,
        message: message.trim(),
        room,
        imageUrl,
        readBy: [userId],
      });

      const populated = await Message.findById(newMsg._id)
        .populate('sender', 'name role roleLabel avatar avatarUrl')
        .lean();

      io.to(room).emit('new-message', populated);
    } catch (err) {
      console.error('[Socket] Error saving message:', err.message);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // ── Chat: Typing Indicator ──
  socket.on('typing', ({ room, isTyping }) => {
    socket.to(room).emit('user:typing', {
      userId: userData.userId,
      name: userData.name,
      role: userData.role,
      isTyping,
    });
  });

  // ── Chat: Mark as Read ──
  socket.on('mark-read', async ({ messageId }) => {
    try {
      await Message.findByIdAndUpdate(messageId, {
        $addToSet: { readBy: userId },
      });
      // Could emit 'message:read' to room if needed
    } catch (err) {
      console.error('[Socket] Error marking read:', err.message);
    }
  });

  // ── Chat: Delete Message ──
  socket.on('delete-message', async ({ messageId, room }) => {
    try {
      const msg = await Message.findById(messageId);
      if (!msg) return;
      
      // Allow deletion if user is the sender OR has a manager role
      const isSender = msg.sender.toString() === userId.toString();
      const isManager = ['admin', 'project_manager', 'PM', 'SuperAdmin', 'owner', 'Owner'].includes(userData.role);
      
      if (isSender || isManager) {
        msg.deleted = true;
        await msg.save();
        io.to(room).emit('message:delete', { messageId });
      }
    } catch (err) {
      console.error('[Socket] Error deleting message:', err.message);
    }
  });

  // ── Chat: Clear Room ──
  socket.on('clear-chat', async ({ room }) => {
    try {
      const isManager = ['admin', 'project_manager', 'PM', 'SuperAdmin', 'owner', 'Owner'].includes(userData.role);
      if (isManager) {
        await Message.updateMany({ room, deleted: false }, { deleted: true });
        io.to(room).emit('chat:clear', { room });
      }
    } catch (err) {
      console.error('[Socket] Error clearing chat:', err.message);
    }
  });

  // ── Disconnect ──
  socket.on('disconnect', async () => {
    onlineUsers.delete(socket.id);

    io.emit('user:offline', {
      userId: userData.userId,
      name: userData.name,
      onlineCount: onlineUsers.size,
    });

    // Update lastSeen
    try {
      await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
    } catch { /* ignore */ }

    console.log(`[Socket] ${userData.name} disconnected (${onlineUsers.size} online)`);
  });
});

// Expose io + onlineUsers to routes if needed
app.set('io', io);
app.set('onlineUsers', onlineUsers);

// ── Cron Jobs ──
cron.schedule('0 * * * *', () => {
  autoLockOldLogs().catch(console.error);
});

cron.schedule('0 0 * * *', () => {
  processEquipmentRentals().catch(console.error);
});

server.listen(PORT, () => {
  console.log(`PlinthHQ API running on http://localhost:${PORT}`);
});
