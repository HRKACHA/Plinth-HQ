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

import https from 'https';

export const proxyDownload = catchAsync(async (req, res) => {
  const doc = await Document.findOne({ _id: req.params.docId, project: req.params.id });
  if (!doc) throw new AppError('Document not found.', 404);

  let fileUrl = doc.fileUrl;
  if (fileUrl.startsWith('http://')) fileUrl = fileUrl.replace('http://', 'https://');

  // Set the proper headers to force the browser to download it as the original filename instead of rendering .txt
  res.setHeader('Content-Type', doc.mimeType || 'application/pdf');
  // Use encodeURIComponent to handle spaces/special chars in filename safely
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(doc.name)}`);

  https.get(fileUrl, (response) => {
    if (response.statusCode !== 200) {
      return res.status(response.statusCode).json({ success: false, message: 'Failed to fetch from cloud storage' });
    }
    response.pipe(res);
  }).on('error', (err) => {
    res.status(500).json({ success: false, message: 'Error downloading file' });
  });
});
