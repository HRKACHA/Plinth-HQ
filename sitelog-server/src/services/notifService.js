import Notification from '../models/Notification.js';

export async function createNotification({ recipient, project, type, title, body, link }) {
  return Notification.create({
    recipient,
    project,
    type,
    title,
    body,
    link,
    channels: ['inApp'],
  });
}

export function emitToProject(io, projectId, event, data) {
  if (io) io.to(`project:${projectId}`).emit(event, data);
}

export async function notifyProjectTeam(io, project, { type, title, body, link, excludeUserId }) {
  const User = (await import('../models/User.js')).default;
  const teamIds = project.team
    .map((m) => m.user?._id || m.user)
    .filter(Boolean)
    .map((u) => u.toString());
  const pms = await User.find({ organisation: project.organisation, role: { $in: ['PM', 'SuperAdmin'] } });
  const recipients = new Set([
    ...teamIds,
    ...pms.map((u) => u._id.toString()),
  ]);

  if (excludeUserId) recipients.delete(excludeUserId.toString());

  for (const id of recipients) {
    if (!id || id === 'null' || id === 'undefined') continue;
    await createNotification({ recipient: id, project: project._id, type, title, body, link });
  }

  emitToProject(io, project._id, 'notification', { type, title, body });
}
