import { describe, it, expect, vi } from 'vitest';
import { ApiKeyValue } from '@/domain/models/api-key/ApiKeyValue';

describe('ApiKeyValue Value Object', () => {
  describe('generate', () => {
    it('mssb_プレフィックスで生成される', () => {
      const key = ApiKeyValue.generate();
      expect(key.rawKey).toMatch(/^mssb_[0-9a-f]{64}$/);
    });

    it('プレフィックスは先頭13文字', () => {
      const key = ApiKeyValue.generate();
      expect(key.prefix).toBe(key.rawKey.substring(0, 13));
      expect(key.prefix).toMatch(/^mssb_[0-9a-f]{8}$/);
    });

    it('ハッシュはSHA-256形式', () => {
      const key = ApiKeyValue.generate();
      expect(key.hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('毎回異なるキーが生成される', () => {
      const key1 = ApiKeyValue.generate();
      const key2 = ApiKeyValue.generate();
      expect(key1.rawKey).not.toBe(key2.rawKey);
    });
  });

  describe('hashOf', () => {
    it('同じ入力なら同じハッシュ', () => {
      const hash1 = ApiKeyValue.hashOf('test_key');
      const hash2 = ApiKeyValue.hashOf('test_key');
      expect(hash1).toBe(hash2);
    });

    it('generateのrawKeyとhashOfの結果が一致する', () => {
      const key = ApiKeyValue.generate();
      expect(ApiKeyValue.hashOf(key.rawKey)).toBe(key.hash);
    });
  });
});
