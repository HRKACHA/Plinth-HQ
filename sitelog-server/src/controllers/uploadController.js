import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

export const uploadFile = catchAsync(async (req, res) => {
  if (!req.file) throw new AppError('No file uploaded.', 400);
  res.status(201).json({
    success: true,
    data: {
      url: req.file.path, // Cloudinary provides the full absolute URL directly in req.file.path
      filename: req.file.filename,
      size: req.file.size,
      mimeType: req.file.mimetype,
    },
  });
});

export const uploadPhotos = catchAsync(async (req, res) => {
  if (!req.files?.length) throw new AppError('No files uploaded.', 400);
  const photos = req.files.map((f) => ({
    url: f.path, // Cloudinary absolute URL
    caption: '',
    uploadedAt: new Date(),
  }));
  res.status(201).json({ success: true, data: photos });
});
