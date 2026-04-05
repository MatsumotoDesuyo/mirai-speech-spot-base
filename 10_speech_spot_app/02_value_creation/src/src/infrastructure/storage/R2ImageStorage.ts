import type { IImageStorage } from '../../domain/repositories/IImageStorage';
import { uploadImage } from '@/lib/r2/client';

export class R2ImageStorage implements IImageStorage {
  async upload(buffer: Buffer, fileName: string, mimeType: string): Promise<string> {
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    return uploadImage(buffer, sanitizedName, mimeType);
  }
}
