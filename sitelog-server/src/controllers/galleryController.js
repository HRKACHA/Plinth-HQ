import SiteLog from '../models/SiteLog.js';
import Issue from '../models/Issue.js';
import Project from '../models/Project.js';
import Message from '../models/Message.js';
import catchAsync from '../utils/catchAsync.js';

export const getProjectGallery = catchAsync(async (req, res) => {
  const projectId = req.params.id;
  
  // Get direct project photos
  const project = await Project.findById(projectId).select('photos').populate('photos.uploadedBy', 'name');
  
  // Get photos from daily logs
  const logs = await SiteLog.find({ project: projectId }).select('date activities photos createdBy').populate('createdBy', 'name');
  
  // Get photos from issues
  const issues = await Issue.find({ project: projectId }).select('title createdAt photos createdBy').populate('createdBy', 'name');
  
  // Get photos from chat messages
  const chatMessages = await Message.find({ room: projectId, imageUrl: { $exists: true, $ne: null } }).select('message createdAt imageUrl senderName');
  
  let gallery = [];

  if (project?.photos) {
    project.photos.forEach(photo => {
      gallery.push({
        url: photo.url,
        source: 'Direct Upload',
        title: 'Project Photo',
        date: photo.uploadedAt,
        uploader: photo.uploadedBy?.name || 'Unknown',
        id: photo._id
      });
    });
  }
  
  logs.forEach(log => {
    if (log.photos && log.photos.length > 0) {
      log.photos.forEach(photo => {
        gallery.push({
          url: photo.url || photo,
          source: 'Daily Log',
          title: log.activities || 'Daily Log',
          date: log.date,
          uploader: log.createdBy?.name || 'Unknown',
          id: log._id
        });
      });
    }
  });
  
  issues.forEach(issue => {
    if (issue.photos && issue.photos.length > 0) {
      issue.photos.forEach(url => {
        gallery.push({
          url,
          source: 'Issue/Snag',
          title: issue.title,
          date: issue.createdAt,
          uploader: issue.createdBy?.name || 'Unknown',
          id: issue._id
        });
      });
    }
  });

  chatMessages.forEach(msg => {
    gallery.push({
      url: msg.imageUrl,
      source: 'Project Chat',
      title: msg.message || 'Chat Photo',
      date: msg.createdAt,
      uploader: msg.senderName || 'Unknown',
      id: msg._id
    });
  });
  
  // Sort by date descending
  gallery.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  res.status(200).json({ success: true, count: gallery.length, data: gallery });
});

export const addGalleryPhoto = catchAsync(async (req, res) => {
  const projectId = req.params.id;
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ success: false, message: 'Image URL is required' });
  }

  const project = await Project.findById(projectId);
  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found' });
  }

  project.photos.push({ url, uploadedBy: req.user._id });
  await project.save();

  res.status(200).json({ success: true, message: 'Photo added to gallery' });
});

export const deleteGalleryPhoto = catchAsync(async (req, res) => {
  const { id, parentId } = req.params; // id is projectId, parentId is the item's id
  const { source, url } = req.body;

  if (source === 'Direct Upload') {
    const project = await Project.findById(id);
    if (project) {
      project.photos = project.photos.filter(p => p._id.toString() !== parentId);
      await project.save();
    }
  } else if (source === 'Daily Log') {
    const log = await SiteLog.findById(parentId);
    if (log) {
      log.photos = log.photos.filter(p => (p.url || p) !== url);
      await log.save();
    }
  } else if (source === 'Issue/Snag') {
    const issue = await Issue.findById(parentId);
    if (issue) {
      issue.photos = issue.photos.filter(p => p !== url);
      await issue.save();
    }
  } else if (source === 'Project Chat') {
    const msg = await Message.findById(parentId);
    if (msg) {
      msg.imageUrl = null;
      await msg.save();
    }
  }

  res.status(200).json({ success: true, message: 'Photo removed from gallery' });
});
