import { describe, it, expect } from 'vitest';
import { Rating } from '@/domain/models/spot/Rating';

describe('Rating Value Object', () => {
  describe('正常系', () => {
    it('1〜10の整数で生成できる', () => {
      for (let i = 1; i <= 10; i++) {
        const rating = Rating.create(i);
        expect(rating.value).toBe(i);
      }
    });

    it('同じ値ならequalsがtrue', () => {
      expect(Rating.create(5).equals(Rating.create(5))).toBe(true);
    });

    it('異なる値ならequalsがfalse', () => {
      expect(Rating.create(3).equals(Rating.create(7))).toBe(false);
    });
  });

  describe('異常系 (R-SV-02)', () => {
    it('0はエラー', () => {
      expect(() => Rating.create(0)).toThrow('推奨Lvは1〜10の整数で指定してください');
    });

    it('11はエラー', () => {
      expect(() => Rating.create(11)).toThrow('推奨Lvは1〜10の整数で指定してください');
    });

    it('小数はエラー', () => {
      expect(() => Rating.create(5.5)).toThrow('推奨Lvは1〜10の整数で指定してください');
    });

    it('負数はエラー', () => {
      expect(() => Rating.create(-1)).toThrow('推奨Lvは1〜10の整数で指定してください');
    });
  });
});
