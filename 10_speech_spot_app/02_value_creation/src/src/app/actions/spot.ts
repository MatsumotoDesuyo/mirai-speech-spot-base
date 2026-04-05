'use server';

import { createClient } from '@supabase/supabase-js';
import { CreateSpotUseCase, AuthenticationError, ImageUploadError } from '@/application/usecases/CreateSpotUseCase';
import { UpdateSpotUseCase } from '@/application/usecases/UpdateSpotUseCase';
import { DeleteSpotUseCase, AdminAuthenticationError } from '@/application/usecases/DeleteSpotUseCase';
import { SupabaseSpotRepository } from '@/infrastructure/repositories/SupabaseSpotRepository';
import { R2ImageStorage } from '@/infrastructure/storage/R2ImageStorage';
import { ApiResponse } from '@/types/spot';

// サーバーサイド用のSupabaseクライアント
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const spotRepository = new SupabaseSpotRepository(supabase);
const imageStorage = new R2ImageStorage();

export async function createSpot(formData: FormData): Promise<ApiResponse<{ id: string }>> {
  try {
    const passcode = formData.get('passcode') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const rating = parseInt(formData.get('rating') as string, 10);
    const lat = parseFloat(formData.get('lat') as string);
    const lng = parseFloat(formData.get('lng') as string);
    const bestTime = JSON.parse(formData.get('bestTime') as string) as number[];
    const audienceAttributes = JSON.parse(formData.get('audienceAttributes') as string) as string[];
    const carAccessibility = formData.get('carAccessibility') as string;

    // 画像ファイルを収集
    const images: { buffer: Buffer; fileName: string; mimeType: string }[] = [];
    let imageIndex = 0;
    while (true) {
      const imageFile = formData.get(`image_${imageIndex}`) as File | null;
      if (!imageFile) break;
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      images.push({ buffer, fileName: imageFile.name, mimeType: imageFile.type });
      imageIndex++;
    }

    const useCase = new CreateSpotUseCase(spotRepository, imageStorage, process.env.PASSCODE!);
    const result = await useCase.execute({
      passcode, title, description, rating, lat, lng,
      bestTime, audienceAttributes, carAccessibility, images,
    });

    return { success: true, data: result };
  } catch (err) {
    if (err instanceof AuthenticationError || err instanceof ImageUploadError) {
      return { success: false, error: err.message };
    }
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: '予期せぬエラーが発生しました' };
  }
}

export async function deleteSpot(
  spotId: string,
  adminPassword: string
): Promise<ApiResponse> {
  try {
    const useCase = new DeleteSpotUseCase(spotRepository, process.env.ADMIN_PASSWORD!);
    await useCase.execute(spotId, adminPassword);
    return { success: true };
  } catch (err) {
    if (err instanceof AdminAuthenticationError) {
      return { success: false, error: err.message };
    }
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: '予期せぬエラーが発生しました' };
  }
}

export async function updateSpot(formData: FormData): Promise<ApiResponse<{ id: string }>> {
  try {
    const passcode = formData.get('passcode') as string;
    const spotId = formData.get('spotId') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const rating = parseInt(formData.get('rating') as string, 10);
    const lat = parseFloat(formData.get('lat') as string);
    const lng = parseFloat(formData.get('lng') as string);
    const bestTime = JSON.parse(formData.get('bestTime') as string) as number[];
    const audienceAttributes = JSON.parse(formData.get('audienceAttributes') as string) as string[];
    const carAccessibility = formData.get('carAccessibility') as string;
    const existingImages = JSON.parse(formData.get('existingImages') as string || '[]') as string[];

    // 新規画像ファイルを収集
    const newImages: { buffer: Buffer; fileName: string; mimeType: string }[] = [];
    let imageIndex = 0;
    while (true) {
      const imageFile = formData.get(`image_${imageIndex}`) as File | null;
      if (!imageFile) break;
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      newImages.push({ buffer, fileName: imageFile.name, mimeType: imageFile.type });
      imageIndex++;
    }

    const useCase = new UpdateSpotUseCase(spotRepository, imageStorage, process.env.PASSCODE!);
    const result = await useCase.execute({
      passcode, spotId, title, description, rating, lat, lng,
      bestTime, audienceAttributes, carAccessibility, existingImages, newImages,
    });

    return { success: true, data: result };
  } catch (err) {
    if (err instanceof AuthenticationError || err instanceof ImageUploadError) {
      return { success: false, error: err.message };
    }
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: '予期せぬエラーが発生しました' };
  }
}
