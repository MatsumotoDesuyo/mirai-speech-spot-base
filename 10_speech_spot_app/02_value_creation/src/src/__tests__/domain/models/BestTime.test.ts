import { describe, it, expect } from 'vitest';
import { BestTime } from '@/domain/models/spot/BestTime';

describe('BestTime Value Object', () => {
  describe('正常系 (R-SV-05)', () => {
    it('8〜19の値で生成できる', () => {
      const bt = BestTime.create([8, 12, 19]);
      expect(bt.values).toEqual([8, 12, 19]);
    });

    it('自動的に昇順ソートされる', () => {
      const bt = BestTime.create([19, 8, 12]);
      expect(bt.values).toEqual([8, 12, 19]);
    });

    it('emptyは空の配列', () => {
      const bt = BestTime.empty();
      expect(bt.values).toEqual([]);
      expect(bt.isEmpty).toBe(true);
    });

    it('toNullableは空ならnull、値があれば配列', () => {
      expect(BestTime.empty().toNullable()).toBeNull();
      expect(BestTime.create([10]).toNullable()).toEqual([10]);
    });

    it('同じ値ならequalsがtrue', () => {
      expect(BestTime.create([8, 12]).equals(BestTime.create([12, 8]))).toBe(true);
    });

    it('valuesは不変', () => {
      const bt = BestTime.create([8, 12]);
      expect(() => { (bt.values as number[])[0] = 999; }).toThrow();
    });
  });

  describe('異常系', () => {
    it('7はエラー（公職選挙法: 8時以前は不可）', () => {
      expect(() => BestTime.create([7])).toThrow('おすすめ時間帯は8〜19の整数で指定してください');
    });

    it('20はエラー（公職選挙法: 20時開始は不可）', () => {
      expect(() => BestTime.create([20])).toThrow('おすすめ時間帯は8〜19の整数で指定してください');
    });

    it('小数はエラー', () => {
      expect(() => BestTime.create([10.5])).toThrow();
    });
  });
});
