import { v2 as cloudinary } from 'cloudinary';
import { logger } from '../utils/logger';
import { env } from './env';

export const initCloudinary = (): void => {
  cloudinary.config({ cloudinary_url: env.cloudinaryUrl });
  logger.info('Cloudinary configured');
};

export { cloudinary };

export const deleteCloudinaryAsset = async (publicId: string): Promise<void> => {
  await cloudinary.uploader.destroy(publicId);
};

export const getPublicId = (url: string): string => {
  // Extract public_id from a Cloudinary URL
  const parts = url.split('/');
  const fileName = parts[parts.length - 1];
  const folder = parts[parts.length - 2];
  return `${folder}/${fileName.split('.')[0]}`;
};
