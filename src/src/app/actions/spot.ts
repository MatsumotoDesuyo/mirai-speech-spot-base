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

      try {
        const buffer = Buffer.from(await imageFile.arrayBuffer());
        const fileName = imageFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const url = await uploadImage(buffer, fileName, imageFile.type);
        imageUrls.push(url);
      } catch (uploadErr) {
        console.error('Image upload error:', uploadErr);
        return { success: false, error: `画像のアップロードに失敗しました: ${uploadErr instanceof Error ? uploadErr.message : '不明なエラー'}` };
      }
      imageIndex++;
    }

    if (imageUrls.length === 0) {
      return { success: false, error: '写真が必要です' };
    }

    // データベースに保存
    const { data, error } = await supabase
      .from('spots')
      .insert({
        title,
        description: description || null,
        rating,
        lat,
        lng,
        best_time: bestTime.length > 0 ? bestTime : null,
        audience_attributes: audienceAttributes.length > 0 ? audienceAttributes : null,
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
