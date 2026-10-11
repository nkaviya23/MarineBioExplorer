import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';

const uploadDir = process.env.UPLOAD_DIR || './uploads';

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    cb(null, `mbe-${uniqueSuffix}${ext}`);
  },
});

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
];

const maxSizeBytes = (parseInt(process.env.MAX_FILE_SIZE_MB || '25', 10)) * 1024 * 1024;

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: maxSizeBytes,
    files: 2, // Up to 1 image and 1 video per submission
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed types: JPEG, PNG, WebP, GIF, MP4, WebM.`));
    }
  },
});

export const storageService = {
  getFilePath(filename: string): string {
    return path.join(uploadDir, path.basename(filename));
  },

  getUrl(filename: string): string {
    // Relative URL served through Express /uploads router
    return `/uploads/${path.basename(filename)}`;
  },

  deleteFile(filename: string): void {
    try {
      const fullPath = path.join(uploadDir, path.basename(filename));
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (err) {
      console.error(`Failed to delete media file ${filename}:`, err);
    }
  },

  isDriverS3(): boolean {
    return (process.env.STORAGE_DRIVER || 'local').toLowerCase() === 's3';
  },
};
