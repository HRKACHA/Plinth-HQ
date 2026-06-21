import SiteLog from '../models/SiteLog.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { notifyProjectTeam } from '../services/notifService.js';

export const listLogs = catchAsync(async (req, res) => {
  const filter = { project: req.params.id };
  if (req.query.from || req.query.to) {
    filter.date = {};
    if (req.query.from) filter.date.$gte = new Date(req.query.from);
    if (req.query.to) filter.date.$lte = new Date(req.query.to);
  }

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;

  const [logs, total] = await Promise.all([
    SiteLog.find(filter)
      .populate('createdBy', 'name avatar')
      .sort('-date')
      .skip((page - 1) * limit)
      .limit(limit),
    SiteLog.countDocuments(filter),
  ]);

  const data = logs.map((log) => ({
    ...log.toObject(),
    id: log._id,
    author: log.createdBy?.name,
    photoCount: log.photos?.length || 0,
  }));

  res.json({ success: true, data, pagination: { page, limit, total } });
});

export const createLog = catchAsync(async (req, res) => {
  const { date, weather, temperature, activities, remarks, photos, labour, materials } = req.body;

  if (!activities) throw new AppError('Activities are required.', 400);

  const logDate = date ? new Date(date) : new Date();

  const startOfDay = new Date(logDate);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(logDate);
  endOfDay.setUTCHours(23, 59, 59, 999);

  let log = await SiteLog.findOne({
    project: req.params.id,
    date: { $gte: startOfDay, $lte: endOfDay }
  });

  if (log) {
    if (log.isLocked && req.user.role !== 'PM' && req.user.role !== 'SuperAdmin') {
      throw new AppError('Log is locked and cannot be edited.', 403);
    }
    
    log.weather = weather || log.weather;
    if (temperature !== undefined) log.temperature = temperature;
    
    // Add clear separator for activities
    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
    if (log.activities.startsWith('Material Transferred') && log.activities.split('\n').length === 1) {
      log.activities = activities;
    } else {
      log.activities = log.activities + `\n\n--- Update (${timeStr}) ---\n` + activities;
    }
    
    if (remarks) log.remarks = remarks;
    if (photos && photos.length > 0) log.photos.push(...photos);
    
    // Aggregate labour without creating duplicates, strictly respecting wage differences
    if (labour && labour.length > 0) {
      labour.forEach(newL => {
        const existing = log.labour.find(l => l.trade === newL.trade && (l.wagePerDay || 0) === (newL.wagePerDay || 0));
        if (existing) {
          existing.present += newL.present;
        } else {
          log.labour.push(newL);
        }
      });
    }
    
    if (materials && materials.length > 0) log.materials.push(...materials);
    
    await log.save();
  } else {
    log = await SiteLog.create({
      project: req.params.id,
      date: logDate,
      weather: weather || 'sunny',
      temperature,
      activities,
      remarks,
      photos: photos || [],
      labour: labour || [],
      materials: materials || [],
      createdBy: req.user._id,
    });
  }

  await log.populate('createdBy', 'name avatar');

  const io = req.app.get('io');
  await notifyProjectTeam(io, req.project, {
    type: 'newLog',
    title: 'New daily log submitted',
    body: `${req.user.name} submitted log for ${logDate.toLocaleDateString('en-IN')}`,
    link: `/projects/${req.params.id}/logs/${log._id}`,
    excludeUserId: req.user._id,
  });
  if (io) io.to(`project:${req.params.id}`).emit('new:log', { logId: log._id });

  res.status(201).json({ success: true, data: log });
});

export const getLog = catchAsync(async (req, res) => {
  const log = await SiteLog.findOne({ _id: req.params.logId, project: req.params.id })
    .populate('createdBy', 'name avatar email');
  if (!log) throw new AppError('Log not found.', 404);
  res.json({
    success: true,
    data: { ...log.toObject(), id: log._id, author: log.createdBy?.name },
  });
});

export const updateLog = catchAsync(async (req, res) => {
  const log = await SiteLog.findOne({ _id: req.params.logId, project: req.params.id });
  if (!log) throw new AppError('Log not found.', 404);
  if (log.isLocked && req.user.role !== 'PM' && req.user.role !== 'SuperAdmin') {
    throw new AppError('Log is locked and cannot be edited.', 403);
  }

  const allowed = ['weather', 'temperature', 'activities', 'remarks', 'photos', 'labour', 'materials'];
  allowed.forEach((k) => { if (req.body[k] !== undefined) log[k] = req.body[k]; });
  await log.save();

  res.json({ success: true, data: log });
});

export const lockLog = catchAsync(async (req, res) => {
  const log = await SiteLog.findOneAndUpdate(
    { _id: req.params.logId, project: req.params.id },
    { isLocked: true, lockedBy: req.user._id },
    { new: true }
  );
  if (!log) throw new AppError('Log not found.', 404);
  res.json({ success: true, data: log });
});

export const deleteLog = catchAsync(async (req, res) => {
  const result = await SiteLog.deleteOne({ _id: req.params.logId, project: req.params.id });
  if (!result.deletedCount) throw new AppError('Log not found.', 404);
  res.json({ success: true, message: 'Log deleted.' });
});

export async function autoLockOldLogs() {
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
  await SiteLog.updateMany(
    { date: { $lt: cutoff }, isLocked: false },
    { isLocked: true }
  );
}
