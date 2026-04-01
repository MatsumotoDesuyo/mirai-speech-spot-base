declare module 'heic-convert/browser' {
  interface ConversionOptions {
    /** HEIC file data — must be a Uint8Array (iterable) */
    buffer: Uint8Array;
    format: 'JPEG' | 'PNG';
    /** JPEG compression quality, between 0 and 1. Default: 0.92 */
    quality?: number;
  }

  function convert(options: ConversionOptions): Promise<Uint8Array<ArrayBuffer>>;
  export default convert;
}
