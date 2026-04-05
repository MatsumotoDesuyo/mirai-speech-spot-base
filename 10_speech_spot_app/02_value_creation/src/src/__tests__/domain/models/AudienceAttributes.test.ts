import { describe, it, expect } from 'vitest';
import { AudienceAttributes } from '@/domain/models/spot/AudienceAttributes';

describe('AudienceAttributes Value Object', () => {
  describe('正常系 (R-SV-06)', () => {
    it('有効な属性で生成できる', () => {
      const aa = AudienceAttributes.create(['学生', '社会人']);
      expect(aa.values).toEqual(['学生', '社会人']);
    });

    it('自動的に定義順でソートされる', () => {
      const aa = AudienceAttributes.create(['ファミリー', '主婦', '学生']);
      expect(aa.values).toEqual(['主婦', '学生', 'ファミリー']);
    });

    it('emptyは空の配列', () => {
      const aa = AudienceAttributes.empty();
      expect(aa.values).toEqual([]);
      expect(aa.isEmpty).toBe(true);
    });

    it('toNullableは空ならnull、値があれば配列', () => {
      expect(AudienceAttributes.empty().toNullable()).toBeNull();
      expect(AudienceAttributes.create(['学生']).toNullable()).toEqual(['学生']);
    });

    it('同じ値（順序不同）ならequalsがtrue', () => {
      const a = AudienceAttributes.create(['社会人', '学生']);
      const b = AudienceAttributes.create(['学生', '社会人']);
      expect(a.equals(b)).toBe(true);
    });

    it('valuesは不変', () => {
      const aa = AudienceAttributes.create(['学生']);
      expect(() => { (aa.values as string[])[0] = '改ざん'; }).toThrow();
    });
  });

  describe('異常系', () => {
    it('未定義の属性でエラー', () => {
      expect(() => AudienceAttributes.create(['外国人'])).toThrow('不正な聴衆属性: 外国人');
    });
  });
});
