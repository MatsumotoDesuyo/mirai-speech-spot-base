/** R-SV-05: おすすめ時間帯（8〜19、昇順ソート済み）
 *  公職選挙法: マイク使用は8〜20時のみ。20時から開始不可のため最大値は19 */
export class BestTime {
  private constructor(private readonly _values: readonly number[]) {}

  static create(values: number[]): BestTime {
    for (const v of values) {
      if (!Number.isInteger(v) || v < 8 || v > 19) {
        throw new Error('おすすめ時間帯は8〜19の整数で指定してください');
      }
    }
    const sorted = [...values].sort((a, b) => a - b);
    return new BestTime(Object.freeze(sorted));
  }

  static empty(): BestTime {
    return new BestTime(Object.freeze([]));
  }

  get values(): readonly number[] {
    return this._values;
  }

  get isEmpty(): boolean {
    return this._values.length === 0;
  }

  /** DB保存用: 空なら null */
  toNullable(): number[] | null {
    return this._values.length > 0 ? [...this._values] : null;
  }

  equals(other: BestTime): boolean {
    if (this._values.length !== other._values.length) return false;
    return this._values.every((v, i) => v === other._values[i]);
  }
}
