// ===========================================
// Constants
// ===========================================

// 聴衆属性の選択肢
export const AUDIENCE_ATTRIBUTES = [
  '主婦',
  '学生',
  '社会人',
  '高齢者',
  'ファミリー',
] as const;

// 選挙カー利用可否の選択肢
export const CAR_ACCESSIBILITY_OPTIONS = [
  { value: 'allowed', label: '使用可' },
  { value: 'brief_stop', label: '一瞬の乗降のみ可' },
  { value: 'not_allowed', label: '不可' },
] as const;

export type CarAccessibility = typeof CAR_ACCESSIBILITY_OPTIONS[number]['value'];

// 時間帯の選択肢（8:00〜22:00）
export const TIME_SLOTS = [
  { id: 8, label: '08:00' },
  { id: 9, label: '09:00' },
  { id: 10, label: '10:00' },
  { id: 11, label: '11:00' },
  { id: 12, label: '12:00' },
  { id: 13, label: '13:00' },
  { id: 14, label: '14:00' },
  { id: 15, label: '15:00' },
  { id: 16, label: '16:00' },
  { id: 17, label: '17:00' },
  { id: 18, label: '18:00' },
  { id: 19, label: '19:00' },
  { id: 20, label: '20:00' },
  { id: 21, label: '21:00' },
  { id: 22, label: '22:00' },
] as const;

// デフォルトの時間帯（未選択）
export const DEFAULT_BEST_TIME: number[] = [];

// デフォルトの推奨レベル
export const DEFAULT_RATING = 7;

// 推奨レベルの説明
export const RATING_DESCRIPTIONS: Record<string, string> = {
  '10': '【S級】広場・ランドマーク（確実な聴衆）',
  '9': '【A級】主要駅・スーパー（主力）',
  '8': '【A級】主要駅・スーパー（主力）',
  '7': '【B級】商店街・公園（堅実な対話）',
  '6': '【B級】商店街・公園（堅実な対話）',
  '5': '【C級】穴場（特定層向け）',
};

// ピンの色（推奨レベル別）
export const PIN_COLORS = {
  high: '#ef4444',    // Lv 8-10: 赤
  medium: '#3b82f6',  // Lv 5-7: 青
  low: '#9ca3af',     // Lv 1-4: グレー
} as const;

export function getPinColor(rating: number): string {
  if (rating >= 8) return PIN_COLORS.high;
  if (rating >= 5) return PIN_COLORS.medium;
  return PIN_COLORS.low;
}

// マップのデフォルト設定
export const MAP_DEFAULTS = {
  lng: Number(process.env.NEXT_PUBLIC_DEFAULT_CENTER_LNG) || 139.7447,
  lat: Number(process.env.NEXT_PUBLIC_DEFAULT_CENTER_LAT) || 35.6762,
  zoom: Number(process.env.NEXT_PUBLIC_DEFAULT_ZOOM) || 14,
} as const;
