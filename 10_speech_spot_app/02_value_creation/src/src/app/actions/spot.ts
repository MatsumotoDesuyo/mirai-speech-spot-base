'use server';

import { createClient } from '@supabase/supabase-js';
import { CreateSpotUseCase, AuthenticationError } from '@/application/usecases/CreateSpotUseCase';
import { UpdateSpotUseCase } from '@/application/usecases/UpdateSpotUseCase';
import { DeleteSpotUseCase, AdminAuthenticationError } from '@/application/usecases/DeleteSpotUseCase';
import { SupabaseSpotRepository } from '@/infrastructure/repositories/SupabaseSpotRepository';
import { generatePresignedUploadUrl } from '@/lib/r2/client';
import { ApiResponse } from '@/types/spot';

const MAX_IMAGES = 10;

// サーバーサイド用のSupabaseクライアント
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const spotRepository = new SupabaseSpotRepository(supabase);

export async function getUploadUrls(
  passcode: string,
  files: { fileName: string; mimeType: string }[],
): Promise<ApiResponse<{ uploadUrl: string; publicUrl: string }[]>> {
  try {
    if (passcode !== process.env.PASSCODE!) {
      throw new AuthenticationError('パスコードが正しくありません');
    }

    if (files.length > MAX_IMAGES) {
      return { success: false, error: `画像は最大${MAX_IMAGES}枚までです` };
    }

    if (files.length === 0) {
      return { success: true, data: [] };
    }

    const results = await Promise.all(
      files.map(async (file) => {
        const { uploadUrl, publicUrl } = await generatePresignedUploadUrl(
          file.fileName,
          file.mimeType,
        );
        return { uploadUrl, publicUrl };
      }),
    );

    return { success: true, data: results };
  } catch (err) {
    if (err instanceof AuthenticationError) {
      return { success: false, error: err.message };
    }
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: '予期せぬエラーが発生しました' };
  }
}

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
    const imageUrls = JSON.parse(formData.get('imageUrls') as string || '[]') as string[];

    const useCase = new CreateSpotUseCase(spotRepository, process.env.PASSCODE!);
    const result = await useCase.execute({
      passcode, title, description, rating, lat, lng,
      bestTime, audienceAttributes, carAccessibility, imageUrls,
    });

    return { success: true, data: result };
  } catch (err) {
    if (err instanceof AuthenticationError) {
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
    const imageUrls = JSON.parse(formData.get('imageUrls') as string || '[]') as string[];

    const useCase = new UpdateSpotUseCase(spotRepository, process.env.PASSCODE!);
    const result = await useCase.execute({
      passcode, spotId, title, description, rating, lat, lng,
      bestTime, audienceAttributes, carAccessibility, existingImages, newImageUrls: imageUrls,
    });

    return { success: true, data: result };
  } catch (err) {
    if (err instanceof AuthenticationError) {
      return { success: false, error: err.message };
    }
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: '予期せぬエラーが発生しました' };
  }
}
