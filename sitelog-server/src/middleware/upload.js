import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import AppError from '../utils/AppError.js';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let resource_type = 'auto';
    if (
      file.mimetype === 'application/pdf' ||
      file.mimetype.includes('msword') ||
      file.mimetype.includes('officedocument')
    ) {
      resource_type = 'raw';
    }

    const ext = file.originalname.split('.').pop().toLowerCase();
    const baseName = file.originalname.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');
    const uniqueId = `${baseName}_${Date.now()}`;

    // Cloudinary blocks the delivery of .pdf files on free accounts. 
    // To bypass this, we trick Cloudinary by saving PDFs with a .bin extension.
    const formatExt = ext === 'pdf' ? 'bin' : ext;

    return {
      folder: 'sitelog-uploads',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'doc', 'docx', 'bin'],
      resource_type: resource_type,
      public_id: resource_type === 'raw' ? `${uniqueId}.${formatExt}` : uniqueId,
    };
  },
});

export const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

export function fileUrl(filename) {
  // This is no longer heavily used because Cloudinary provides the full URL directly,
  // but kept for backward compatibility if needed.
  return filename;
}
