import { createHash, randomBytes } from 'crypto';

/** APIキー値オブジェクト: 生成・ハッシュ・プレフィックスのドメインロジック */
export class ApiKeyValue {
  private constructor(
    private readonly _rawKey: string,
    private readonly _hash: string,
    private readonly _prefix: string,
  ) {}

  /** 新しいAPIキーを生成 */
  static generate(): ApiKeyValue {
    const rawKey = `mssb_${randomBytes(32).toString('hex')}`;
    const hash = createHash('sha256').update(rawKey).digest('hex');
    const prefix = rawKey.substring(0, 13); // "mssb_" + 8文字
    return new ApiKeyValue(rawKey, hash, prefix);
  }

  /** 既存キーからハッシュを計算（検証用） */
  static hashOf(rawKey: string): string {
    return createHash('sha256').update(rawKey).digest('hex');
  }

  get rawKey(): string { return this._rawKey; }
  get hash(): string { return this._hash; }
  get prefix(): string { return this._prefix; }
}
