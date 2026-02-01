'use server';

import { createClient } from '@supabase/supabase-js';
import { uploadImage } from '@/lib/r2/client';
import { ApiResponse } from '@/types/spot';

// サーバーサイド用のSupabaseクライアント
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PASSCODE = process.env.PASSCODE;

// 聴衆属性の正規順序（constants.tsと同じ）
const AUDIENCE_ATTRIBUTES_ORDER = ['主婦', '学生', '社会人', '高齢者', 'ファミリー'];

// 聴衆属性をソート
function sortAudienceAttributes(attrs: string[]): string[] {
  return [...attrs].sort((a, b) => {
    const indexA = AUDIENCE_ATTRIBUTES_ORDER.indexOf(a);
    const indexB = AUDIENCE_ATTRIBUTES_ORDER.indexOf(b);
    // 定義順に並べる（未知の属性は末尾）
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });
}

// 時間帯をソート（数値昇順）
function sortBestTime(times: number[]): number[] {
  return [...times].sort((a, b) => a - b);
}

export async function createSpot(formData: FormData): Promise<ApiResponse<{ id: string }>> {
  try {
    // パスコード検証
    const passcode = formData.get('passcode') as string;
    if (passcode !== PASSCODE) {
      return { success: false, error: 'パスコードが正しくありません' };
    }

    // フォームデータを取得
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const rating = parseInt(formData.get('rating') as string, 10);
    const lat = parseFloat(formData.get('lat') as string);
    const lng = parseFloat(formData.get('lng') as string);
    const bestTime = JSON.parse(formData.get('bestTime') as string) as number[];
    const audienceAttributes = JSON.parse(formData.get('audienceAttributes') as string) as string[];
    const carAccessibility = formData.get('carAccessibility') as string;

    // バリデーション
    if (!title || !rating || !lat || !lng) {
      return { success: false, error: '必須項目が入力されていません' };
    }

    if (!carAccessibility || !['allowed', 'brief_stop', 'not_allowed'].includes(carAccessibility)) {
      return { success: false, error: '選挙カー利用可否を選択してください' };
    }

    // 画像をアップロード
    const imageUrls: string[] = [];
    let imageIndex = 0;
    
    while (true) {
      const imageFile = formData.get(`image_${imageIndex}`) as File | null;
      if (!imageFile) break;

      console.log(`Processing image ${imageIndex}: ${imageFile.name}, size: ${imageFile.size} bytes`);
      
      try {
        const buffer = Buffer.from(await imageFile.arrayBuffer());
        const fileName = imageFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const url = await uploadImage(buffer, fileName, imageFile.type);
        imageUrls.push(url);
        console.log(`Image ${imageIndex} uploaded successfully`);
      } catch (uploadErr) {
        console.error(`Image upload error for image ${imageIndex}:`, uploadErr);
        return { success: false, error: `画像${imageIndex + 1}のアップロードに失敗しました: ${uploadErr instanceof Error ? uploadErr.message : '不明なエラー'}` };
      }
      imageIndex++;
    }

    console.log(`Total images uploaded: ${imageUrls.length}`);

    if (imageUrls.length === 0) {
      return { success: false, error: '写真が必要です' };
    }

    // データベースに保存
    const sortedBestTime = sortBestTime(bestTime);
    const sortedAudienceAttributes = sortAudienceAttributes(audienceAttributes);
    
    const { data, error } = await supabase
      .from('spots')
      .insert({
        title,
        description: description || null,
        rating,
        lat,
        lng,
        best_time: sortedBestTime.length > 0 ? sortedBestTime : null,
        audience_attributes: sortedAudienceAttributes.length > 0 ? sortedAudienceAttributes : null,
        car_accessibility: carAccessibility,
        images: imageUrls,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Database error:', error);
      return { success: false, error: 'データベースへの保存に失敗しました' };
    }

    return { success: true, data: { id: data.id } };
  } catch (err) {
    console.error('Create spot error:', err);
    return { success: false, error: '予期せぬエラーが発生しました' };
  }
}

export async function deleteSpot(
  spotId: string,
  adminPassword: string
): Promise<ApiResponse> {
  try {
    // 管理者パスワード検証
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return { success: false, error: '管理者パスワードが正しくありません' };
    }

    const { error } = await supabase
      .from('spots')
      .delete()
      .eq('id', spotId);

    if (error) {
      console.error('Delete error:', error);
      return { success: false, error: '削除に失敗しました' };
    }

    return { success: true };
  } catch (err) {
    console.error('Delete spot error:', err);
    return { success: false, error: '予期せぬエラーが発生しました' };
  }
}

export async function updateSpot(formData: FormData): Promise<ApiResponse<{ id: string }>> {
  try {
    // パスコード検証
    const passcode = formData.get('passcode') as string;
    if (passcode !== PASSCODE) {
      return { success: false, error: 'パスコードが正しくありません' };
    }

    const spotId = formData.get('spotId') as string;
    if (!spotId) {
      return { success: false, error: 'スポットIDが指定されていません' };
    }

    // フォームデータを取得
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const rating = parseInt(formData.get('rating') as string, 10);
    const lat = parseFloat(formData.get('lat') as string);
    const lng = parseFloat(formData.get('lng') as string);
    const bestTime = JSON.parse(formData.get('bestTime') as string) as number[];
    const audienceAttributes = JSON.parse(formData.get('audienceAttributes') as string) as string[];
    const carAccessibility = formData.get('carAccessibility') as string;
    const existingImages = JSON.parse(formData.get('existingImages') as string || '[]') as string[];

    // バリデーション
    if (!title || !rating || !lat || !lng) {
      return { success: false, error: '必須項目が入力されていません' };
    }

    if (!carAccessibility || !['allowed', 'brief_stop', 'not_allowed'].includes(carAccessibility)) {
      return { success: false, error: '選挙カー利用可否を選択してください' };
    }

    // 新しい画像をアップロード
    const newImageUrls: string[] = [];
    let imageIndex = 0;
    
    while (true) {
      const imageFile = formData.get(`image_${imageIndex}`) as File | null;
      if (!imageFile) break;

      console.log(`Processing new image ${imageIndex}: ${imageFile.name}, size: ${imageFile.size} bytes`);

      try {
        const buffer = Buffer.from(await imageFile.arrayBuffer());
        const fileName = imageFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const url = await uploadImage(buffer, fileName, imageFile.type);
        newImageUrls.push(url);
        console.log(`New image ${imageIndex} uploaded successfully`);
      } catch (uploadErr) {
        console.error(`Image upload error for new image ${imageIndex}:`, uploadErr);
        return { success: false, error: `画像${imageIndex + 1}のアップロードに失敗しました: ${uploadErr instanceof Error ? uploadErr.message : '不明なエラー'}` };
      }
      imageIndex++;
    }

    console.log(`Existing images: ${existingImages.length}, New images: ${newImageUrls.length}`);

    // 既存画像 + 新規画像
    const allImages = [...existingImages, ...newImageUrls];

    if (allImages.length === 0) {
      return { success: false, error: '写真が必要です' };
    }

    // データベースを更新
    const sortedBestTime = sortBestTime(bestTime);
    const sortedAudienceAttributes = sortAudienceAttributes(audienceAttributes);
    
    const { data, error } = await supabase
      .from('spots')
      .update({
        title,
        description: description || null,
        rating,
        lat,
        lng,
        best_time: sortedBestTime.length > 0 ? sortedBestTime : null,
        audience_attributes: sortedAudienceAttributes.length > 0 ? sortedAudienceAttributes : null,
        car_accessibility: carAccessibility,
        images: allImages,
        updated_at: new Date().toISOString(),
      })
      .eq('id', spotId)
      .select('id')
      .single();

    if (error) {
      console.error('Database error:', error);
      return { success: false, error: 'データベースの更新に失敗しました' };
    }

    return { success: true, data: { id: data.id } };
  } catch (err) {
    console.error('Update spot error:', err);
    return { success: false, error: '予期せぬエラーが発生しました' };
  }
}
