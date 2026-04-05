import { describe, it, expect } from 'vitest';
import { Location } from '@/domain/models/spot/Location';

describe('Location Value Object', () => {
  describe('正常系', () => {
    it('有効な緯度経度で生成できる', () => {
      const loc = Location.create(35.6762, 139.6503);
      expect(loc.lat).toBe(35.6762);
      expect(loc.lng).toBe(139.6503);
    });

    it('境界値（最小）で生成できる', () => {
      const loc = Location.create(-90, -180);
      expect(loc.lat).toBe(-90);
      expect(loc.lng).toBe(-180);
    });

    it('境界値（最大）で生成できる', () => {
      const loc = Location.create(90, 180);
      expect(loc.lat).toBe(90);
      expect(loc.lng).toBe(180);
    });

    it('同じ座標ならequalsがtrue', () => {
      expect(Location.create(35, 139).equals(Location.create(35, 139))).toBe(true);
    });

    it('異なる座標ならequalsがfalse', () => {
      expect(Location.create(35, 139).equals(Location.create(36, 139))).toBe(false);
    });
  });

  describe('異常系 (R-SV-04)', () => {
    it('緯度が-90未満でエラー', () => {
      expect(() => Location.create(-91, 0)).toThrow('緯度');
    });

    it('緯度が90超でエラー', () => {
      expect(() => Location.create(91, 0)).toThrow('緯度');
    });

    it('経度が-180未満でエラー', () => {
      expect(() => Location.create(0, -181)).toThrow('経度');
    });

    it('経度が180超でエラー', () => {
      expect(() => Location.create(0, 181)).toThrow('経度');
    });
  });
});
