import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  GetSpotsApiUseCase,
  InvalidApiKeyError,
  ApiKeyDisabledError,
  RateLimitExceededError,
} from '@/application/usecases/GetSpotsApiUseCase';
import { SupabaseApiKeyRepository } from '@/infrastructure/repositories/SupabaseApiKeyRepository';
import { SupabaseApiAccessLogRepository } from '@/infrastructure/repositories/SupabaseApiAccessLogRepository';
import { SupabaseSpotRepository } from '@/infrastructure/repositories/SupabaseSpotRepository';
import type { GeoJsonFeatureCollection } from '@/types/spot';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const apiKeyRepository = new SupabaseApiKeyRepository(supabase);
const accessLogRepository = new SupabaseApiAccessLogRepository(supabase);
const spotRepository = new SupabaseSpotRepository(supabase);

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json(
    { error: { code, message } },
    {
      status,
      headers: { 'Cache-Control': 'no-store' },
    }
  );
}

export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get('X-API-Key');
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;

    const useCase = new GetSpotsApiUseCase(apiKeyRepository, accessLogRepository, spotRepository);
    const { spots } = await useCase.execute(apiKey, ip);

    // GeoJSON レスポンス構築
    const geojson: GeoJsonFeatureCollection = {
      type: 'FeatureCollection',
      metadata: {
        attribution: '演説スポットBase',
        license: 'AGPL-3.0',
        license_url: 'https://github.com/mirai-speech/mirai-speech-spot-base/blob/main/LICENSE',
        generated_at: new Date().toISOString(),
        total_count: spots.length,
      },
      features: spots.map((spot) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [spot.location.lng, spot.location.lat] as [number, number],
        },
        properties: {
          id: spot.id,
          title: spot.title,
          description: spot.description,
          rating: spot.rating.value,
          best_time: spot.bestTime.toNullable(),
          audience_attributes: spot.audienceAttributes.toNullable(),
          car_accessibility: spot.carAccessibility.value,
          images: [...spot.images],
          created_at: spot.createdAt,
          updated_at: spot.updatedAt,
        },
      })),
    };

    return NextResponse.json(geojson, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    if (err instanceof InvalidApiKeyError) {
      return errorResponse(401, 'INVALID_API_KEY', err.message);
    }
    if (err instanceof ApiKeyDisabledError) {
      return errorResponse(403, 'API_KEY_DISABLED', err.message);
    }
    if (err instanceof RateLimitExceededError) {
      return errorResponse(429, 'RATE_LIMIT_EXCEEDED', err.message);
    }
    return errorResponse(500, 'INTERNAL_ERROR', 'An internal error occurred.');
  }
}
