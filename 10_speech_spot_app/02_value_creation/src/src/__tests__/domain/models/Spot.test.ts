import { describe, it, expect } from 'vitest';
import { Spot } from '@/domain/models/spot/Spot';

const VALID_INPUT = {
  title: '国会議事堂前',
  description: 'テスト説明',
  rating: 8,
  lat: 35.6762,
  lng: 139.6503,
  carAccessibility: 'allowed',
  bestTime: [12, 8, 10],
  audienceAttributes: ['社会人', '学生'],
  imageUrls: ['https://example.com/img.jpg'],
};

describe('Spot Entity', () => {
  describe('create（新規作成）', () => {
    it('正常に生成できる', () => {
      const spot = Spot.create(VALID_INPUT);
      expect(spot.title).toBe('国会議事堂前');
      expect(spot.rating.value).toBe(8);
      expect(spot.location.lat).toBe(35.6762);
      expect(spot.carAccessibility.value).toBe('allowed');
    });

    it('bestTimeが昇順ソートされる', () => {
      const spot = Spot.create(VALID_INPUT);
      expect([...spot.bestTime.values]).toEqual([8, 10, 12]);
    });

    it('audienceAttributesが定義順ソートされる', () => {
      const spot = Spot.create(VALID_INPUT);
      expect([...spot.audienceAttributes.values]).toEqual(['学生', '社会人']);
    });

    it('タイトル空でエラー (R-SV-01)', () => {
      expect(() => Spot.create({ ...VALID_INPUT, title: '' })).toThrow('必須項目が入力されていません');
    });

    it('descriptionがnullでも生成できる', () => {
      const spot = Spot.create({ ...VALID_INPUT, description: null });
      expect(spot.description).toBeNull();
    });

    it('bestTime空配列はBestTime.emptyになる', () => {
      const spot = Spot.create({ ...VALID_INPUT, bestTime: [] });
      expect(spot.bestTime.isEmpty).toBe(true);
    });
  });

  describe('forUpdate（更新用ファクトリ）', () => {
    it('正常に生成できupatedAtが設定される', () => {
      const spot = Spot.forUpdate('spot-123', {
        title: '更新タイトル',
        description: null,
        rating: 5,
        lat: 35.0,
        lng: 139.0,
        carAccessibility: 'brief_stop',
        bestTime: [],
        audienceAttributes: [],
        images: [],
      });
      expect(spot.id).toBe('spot-123');
      expect(spot.title).toBe('更新タイトル');
      expect(spot.updatedAt).not.toBe('');
    });
  });

  describe('toInsertRecord', () => {
    it('DB保存用のsnake_caseレコードを生成する', () => {
      const spot = Spot.create(VALID_INPUT);
      const record = spot.toInsertRecord();
      expect(record).toHaveProperty('car_accessibility', 'allowed');
      expect(record).toHaveProperty('best_time');
      expect(record).toHaveProperty('audience_attributes');
      expect((record.best_time as number[])).toEqual([8, 10, 12]);
    });
  });

  describe('toUpdateRecord', () => {
    it('updated_atを含むレコードを生成する', () => {
      const spot = Spot.forUpdate('id', {
        title: 'T', description: null, rating: 1, lat: 0, lng: 0,
        carAccessibility: 'allowed', bestTime: [], audienceAttributes: [], images: [],
      });
      const record = spot.toUpdateRecord();
      expect(record).toHaveProperty('updated_at');
    });
  });
});
