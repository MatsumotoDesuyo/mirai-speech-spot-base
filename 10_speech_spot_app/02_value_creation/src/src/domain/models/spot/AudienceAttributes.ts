/** R-SV-06: 聴衆属性（定義順ソート済み） */
const AUDIENCE_ATTRIBUTES_ORDER = ['主婦', '学生', '社会人', '高齢者', 'ファミリー'] as const;
export type AudienceAttributeValue = (typeof AUDIENCE_ATTRIBUTES_ORDER)[number];

export class AudienceAttributes {
  private constructor(private readonly _values: readonly AudienceAttributeValue[]) {}

  static create(values: string[]): AudienceAttributes {
    for (const v of values) {
      if (!AUDIENCE_ATTRIBUTES_ORDER.includes(v as AudienceAttributeValue)) {
        throw new Error(`不正な聴衆属性: ${v}`);
      }
    }
    const sorted = [...values].sort((a, b) => {
      const indexA = AUDIENCE_ATTRIBUTES_ORDER.indexOf(a as AudienceAttributeValue);
      const indexB = AUDIENCE_ATTRIBUTES_ORDER.indexOf(b as AudienceAttributeValue);
      return indexA - indexB;
    }) as AudienceAttributeValue[];
    return new AudienceAttributes(Object.freeze(sorted));
  }

  static empty(): AudienceAttributes {
    return new AudienceAttributes(Object.freeze([]));
  }

  get values(): readonly AudienceAttributeValue[] {
    return this._values;
  }

  get isEmpty(): boolean {
    return this._values.length === 0;
  }

  /** DB保存用: 空なら null */
  toNullable(): string[] | null {
    return this._values.length > 0 ? [...this._values] : null;
  }

  equals(other: AudienceAttributes): boolean {
    if (this._values.length !== other._values.length) return false;
    return this._values.every((v, i) => v === other._values[i]);
  }
}
