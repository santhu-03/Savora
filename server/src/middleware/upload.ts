import { Readable } from 'stream';
import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import type { UploadApiOptions } from 'cloudinary';
import { cloudinary } from '../config/cloudinary';
import { AppError } from './errorHandler';

const MB = 1024 * 1024;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  ALLOWED_MIME.has(file.mimetype)
    ? cb(null, true)
    : cb(new AppError('Only JPEG, PNG, WebP, and GIF images are allowed', 400));
};

const memStorage = multer.memoryStorage();

// ─── Upload a buffer directly to Cloudinary v2 ───────────────
interface CloudinaryResult { url: string; publicId: string }

function uploadBuffer(
  buffer: Buffer,
  options: UploadApiOptions
): Promise<CloudinaryResult> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err || !result) return reject(err ?? new Error('Cloudinary upload failed'));
      resolve({ url: result.secure_url, publicId: result.public_id });
    });
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(stream);
  });
}

// ─── Middleware factory ───────────────────────────────────────
type UploadMode = { kind: 'single'; field: string } | { kind: 'array'; field: string; max: number };

function makeUploader(
  mode: UploadMode,
  cloudinaryOptions: UploadApiOptions,
  fileSizeMB = 5
) {
  const base = multer({ storage: memStorage, limits: { fileSize: fileSizeMB * MB }, fileFilter });
  const multerMw = mode.kind === 'single'
    ? base.single(mode.field)
    : base.array(mode.field, mode.max);

  return (req: Request, res: Response, next: NextFunction) => {
    multerMw(req, res, async (err) => {
      if (err) return next(err);
      try {
        if (req.file?.buffer) {
          const r = await uploadBuffer(req.file.buffer, cloudinaryOptions);
          (req.file as any).path = r.url;
          (req.file as any).filename = r.publicId;
        } else if (Array.isArray(req.files)) {
          await Promise.all(
            (req.files as Express.Multer.File[]).map(async f => {
              const r = await uploadBuffer(f.buffer, cloudinaryOptions);
              (f as any).path = r.url;
              (f as any).filename = r.publicId;
            })
          );
        }
        next();
      } catch (uploadErr) {
        next(uploadErr);
      }
    });
  };
}

// ─── Exported middleware ──────────────────────────────────────
export const menuImageUpload = makeUploader(
  { kind: 'single', field: 'image' },
  { folder: 'savora/menu', transformation: [{ width: 900, height: 675, crop: 'fill', quality: 'auto:good' }] }
);

export const menuImagesUpload = makeUploader(
  { kind: 'array', field: 'images', max: 5 },
  { folder: 'savora/menu', transformation: [{ width: 900, height: 675, crop: 'fill', quality: 'auto:good' }] }
);

export const avatarUpload = makeUploader(
  { kind: 'single', field: 'avatar' },
  { folder: 'savora/avatars', transformation: [{ width: 256, height: 256, crop: 'fill', gravity: 'face', quality: 'auto' }] },
  2
);

export const restaurantImageUpload = makeUploader(
  { kind: 'single', field: 'image' },
  { folder: 'savora/restaurants', transformation: [{ width: 1200, height: 630, crop: 'fill', quality: 'auto:good' }] }
);

export const reviewImagesUpload = makeUploader(
  { kind: 'array', field: 'images', max: 4 },
  { folder: 'savora/reviews', transformation: [{ width: 800, height: 600, crop: 'limit', quality: 'auto' }] }
);
