import SiteLog from '../models/SiteLog.js';
import Issue from '../models/Issue.js';
import Project from '../models/Project.js';
import catchAsync from '../utils/catchAsync.js';

export const getProjectGallery = catchAsync(async (req, res) => {
  const projectId = req.params.id;
  
  // Get direct project photos
  const project = await Project.findById(projectId).select('photos').populate('photos.uploadedBy', 'name');
  
  // Get photos from daily logs
  const logs = await SiteLog.find({ project: projectId }).select('date activities photos createdBy').populate('createdBy', 'name');
  
  // Get photos from issues
  const issues = await Issue.find({ project: projectId }).select('title createdAt photos createdBy').populate('createdBy', 'name');
  
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
