import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import type { Spot, GeoJsonFeatureCollection } from '@/types/spot';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const DAILY_RATE_LIMIT = 10;

function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

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
  // 1. APIキー取得
  const apiKey = request.headers.get('X-API-Key');
  if (!apiKey) {
    return errorResponse(401, 'INVALID_API_KEY', 'X-API-Key header is required.');
  }

  // 2. APIキー検証
  const keyHash = hashApiKey(apiKey);
  const { data: keyRecord, error: keyError } = await supabase
    .from('api_keys')
    .select('id, app_name, is_active')
    .eq('api_key_hash', keyHash)
    .single();

  if (keyError || !keyRecord) {
    return errorResponse(401, 'INVALID_API_KEY', 'Invalid API key.');
  }

  if (!keyRecord.is_active) {
    return errorResponse(403, 'API_KEY_DISABLED', 'This API key has been disabled.');
  }

  // 3. レート制限チェック（UTC日次）
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const { count, error: countError } = await supabase
    .from('api_access_logs')
    .select('*', { count: 'exact', head: true })
    .eq('api_key_id', keyRecord.id)
    .gte('accessed_at', todayStart.toISOString())
    .eq('response_status', 200);

  if (countError) {
    console.error('Rate limit check error:', countError);
    return errorResponse(500, 'INTERNAL_ERROR', 'An internal error occurred.');
  }

  const todayCount = count ?? 0;
  if (todayCount >= DAILY_RATE_LIMIT) {
    // レート制限超過もログに記録
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
    await supabase.from('api_access_logs').insert({
      api_key_id: keyRecord.id,
      response_status: 429,
      ip_address: ip,
    });

    return errorResponse(
      429,
      'RATE_LIMIT_EXCEEDED',
      `Daily API limit (${DAILY_RATE_LIMIT} requests) exceeded. Try again tomorrow.`
    );
  }

  // 4. スポットデータ取得
  const { data: spots, error: spotsError } = await supabase
    .from('spots')
    .select('*')
    .order('created_at', { ascending: true });

  if (spotsError) {
    console.error('Spots fetch error:', spotsError);
    // エラーもログに記録
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
    await supabase.from('api_access_logs').insert({
      api_key_id: keyRecord.id,
      response_status: 500,
      ip_address: ip,
    });
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to fetch spots data.');
  }

  // 5. アクセスログ記録（成功）
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
  await supabase.from('api_access_logs').insert({
    api_key_id: keyRecord.id,
    response_status: 200,
    ip_address: ip,
  });

  // 6. GeoJSON レスポンス構築
  const typedSpots = spots as Spot[];
  const geojson: GeoJsonFeatureCollection = {
    type: 'FeatureCollection',
    metadata: {
      attribution: '演説スポットBase',
      license: 'AGPL-3.0',
      license_url: 'https://github.com/mirai-speech/mirai-speech-spot-base/blob/main/LICENSE',
      generated_at: new Date().toISOString(),
      total_count: typedSpots.length,
    },
    features: typedSpots.map((spot) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [spot.lng, spot.lat] as [number, number],
      },
      properties: {
        id: spot.id,
        title: spot.title,
        description: spot.description,
        rating: spot.rating,
        best_time: spot.best_time,
        audience_attributes: spot.audience_attributes,
        car_accessibility: spot.car_accessibility,
        images: spot.images,
        created_at: spot.created_at,
        updated_at: spot.updated_at,
      },
    })),
  };

  return NextResponse.json(geojson, {
    status: 200,
    headers: { 'Cache-Control': 'no-store' },
  });
}
