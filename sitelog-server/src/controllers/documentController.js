import Document from '../models/Document.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';

export const listDocuments = catchAsync(async (req, res) => {
  const docs = await Document.find({ project: req.params.id })
    .populate('uploadedBy', 'name')
    .sort('-createdAt');
  res.json({ success: true, data: docs });
});

export const uploadDocument = catchAsync(async (req, res) => {
  if (!req.file) throw new AppError('File required.', 400);

  const doc = await Document.create({
    project: req.params.id,
    name: req.body.name || req.file.originalname,
    type: req.body.type || 'other',
    fileUrl: req.file.path,
    fileSize: req.file.size,
    mimeType: req.file.mimetype,
    tags: req.body.tags ? JSON.parse(req.body.tags) : [],
    uploadedBy: req.user._id,
    versions: [{ url: req.file.path, version: 1, uploadedAt: new Date(), uploadedBy: req.user._id }],
  });

  res.status(201).json({ success: true, data: doc });
});

export const deleteDocument = catchAsync(async (req, res) => {
  const result = await Document.deleteOne({ _id: req.params.docId, project: req.params.id });
  if (!result.deletedCount) throw new AppError('Document not found.', 404);
  res.json({ success: true, message: 'Document deleted.' });
});
