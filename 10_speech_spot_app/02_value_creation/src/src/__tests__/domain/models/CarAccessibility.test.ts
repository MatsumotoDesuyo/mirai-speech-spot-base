import { describe, it, expect } from 'vitest';
import { CarAccessibility } from '@/domain/models/spot/CarAccessibility';

describe('CarAccessibility Value Object', () => {
  describe('正常系 (R-SV-03)', () => {
    it.each(['allowed', 'brief_stop', 'not_allowed'])('%s で生成できる', (val) => {
      const ca = CarAccessibility.create(val);
      expect(ca.value).toBe(val);
    });

    it('同じ値ならequalsがtrue', () => {
      expect(CarAccessibility.create('allowed').equals(CarAccessibility.create('allowed'))).toBe(true);
    });

    it('異なる値ならequalsがfalse', () => {
      expect(CarAccessibility.create('allowed').equals(CarAccessibility.create('not_allowed'))).toBe(false);
    });
  });

  describe('異常系', () => {
    it('不正な値でエラー', () => {
      expect(() => CarAccessibility.create('invalid')).toThrow('選挙カー利用可否を選択してください');
    });

    it('空文字でエラー', () => {
      expect(() => CarAccessibility.create('')).toThrow();
    });
  });
});
