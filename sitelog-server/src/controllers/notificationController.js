import Notification from '../models/Notification.js';
import catchAsync from '../utils/catchAsync.js';

export const listNotifications = catchAsync(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .sort('-createdAt')
    .limit(50);
  res.json({ success: true, data: notifications });
});

export const markRead = catchAsync(async (req, res) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.nId, recipient: req.user._id },
    { isRead: true }
  );
  res.json({ success: true, message: 'Marked as read.' });
});

export const markAllRead = catchAsync(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
  res.json({ success: true, message: 'All marked as read.' });
});
