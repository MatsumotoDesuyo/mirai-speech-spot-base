/**
 * FormData ヘルパー
 *
 * テスト用の FormData を構築するユーティリティ。
 * Node.js 環境では FormData がグローバルに存在するため（Node 18+）、直接利用可能。
 */

export interface SpotFormFields {
  passcode?: string;
  title?: string;
  description?: string;
  rating?: number;
  lat?: number;
  lng?: number;
  bestTime?: number[];
  audienceAttributes?: string[];
  carAccessibility?: string;
  spotId?: string;
  existingImages?: string[];
  imageUrls?: string[];
}

/**
 * createSpot / updateSpot 用の FormData を構築する。
 */
export function buildSpotFormData(fields: SpotFormFields): FormData {
  const formData = new FormData();

  if (fields.passcode !== undefined) formData.set('passcode', fields.passcode);
  if (fields.title !== undefined) formData.set('title', fields.title);
  if (fields.description !== undefined) formData.set('description', fields.description);
  if (fields.rating !== undefined) formData.set('rating', String(fields.rating));
  if (fields.lat !== undefined) formData.set('lat', String(fields.lat));
  if (fields.lng !== undefined) formData.set('lng', String(fields.lng));
  if (fields.bestTime !== undefined) formData.set('bestTime', JSON.stringify(fields.bestTime));
  if (fields.audienceAttributes !== undefined) formData.set('audienceAttributes', JSON.stringify(fields.audienceAttributes));
  if (fields.carAccessibility !== undefined) formData.set('carAccessibility', fields.carAccessibility);
  if (fields.spotId !== undefined) formData.set('spotId', fields.spotId);
  if (fields.existingImages !== undefined) formData.set('existingImages', JSON.stringify(fields.existingImages));
  if (fields.imageUrls !== undefined) formData.set('imageUrls', JSON.stringify(fields.imageUrls));

  return formData;
}

/**
 * 全必須フィールドを含むデフォルトの有効なスポットデータ。
 */
export const VALID_SPOT_DATA: SpotFormFields = {
  passcode: 'test-passcode',
  title: 'テスト演説スポット',
  description: 'テストの説明',
  rating: 7,
  lat: 35.6762,
  lng: 139.7447,
  bestTime: [10, 14, 8],
  audienceAttributes: ['ファミリー', '主婦', '学生'],
  carAccessibility: 'allowed',
};
