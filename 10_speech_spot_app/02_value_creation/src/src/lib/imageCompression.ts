/**
 * 画像圧縮ユーティリティ
 * Vercel Hobbyプランのボディサイズ制限（4.5MB）対策
 */

// 圧縮設定
const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1920;
const JPEG_QUALITY = 0.8;
const TARGET_SIZE_KB = 1000; // 目標サイズ: 1MB以下

// HEIC/HEIF判定用MIMEタイプ
const HEIC_MIME_TYPES = ['image/heic', 'image/heif'];
const HEIC_EXTENSIONS = ['.heic', '.heif'];

/**
 * HEIC/HEIFファイルかどうかを判定する
 * MIMEタイプと拡張子の両方で判定（MIMEタイプが空の場合があるため）
 */
function isHeicFile(file: File): boolean {
  if (HEIC_MIME_TYPES.includes(file.type.toLowerCase())) {
    return true;
  }
  const ext = file.name.toLowerCase().match(/\.[^/.]+$/)?.[0] ?? '';
  return HEIC_EXTENSIONS.includes(ext);
}

/**
 * HEIC/HEIFファイルをheic-convertでJPEGに変換する
 * ブラウザがネイティブでHEICをデコードできない場合のフォールバック
 */
async function convertHeicToJpeg(file: File): Promise<File> {
  const mod = await import('heic-convert/browser');
  // CJS module.exports 互換: Turbopackではdefaultに入る場合と直接入る場合がある
  const convert = typeof mod.default === 'function' ? mod.default : (mod as unknown as typeof mod.default);
  const inputBuffer = new Uint8Array(await file.arrayBuffer());
  const outputBuffer = await convert({
    buffer: inputBuffer,
    format: 'JPEG',
    quality: JPEG_QUALITY,
  });
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  return new File([outputBuffer], `${baseName}.jpg`, {
    type: 'image/jpeg',
    lastModified: Date.now(),
  });
}

/**
 * 画像をCanvasでJPEGに変換・圧縮する
 */
function compressViaCanvas(file: File, objectUrl: string): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      // アスペクト比を維持しながらリサイズ
      let { width, height } = img;

      if (width > MAX_WIDTH) {
        height = (height * MAX_WIDTH) / width;
        width = MAX_WIDTH;
      }

      if (height > MAX_HEIGHT) {
        width = (width * MAX_HEIGHT) / height;
        height = MAX_HEIGHT;
      }

      canvas.width = width;
      canvas.height = height;

      // 画像を描画
      ctx.drawImage(img, 0, 0, width, height);

      // Blobに変換
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }

          const baseName = file.name.replace(/\.[^/.]+$/, '');
          const newFile = new File([blob], `${baseName}.jpg`, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });

          console.log(
            `Image compressed: ${(file.size / 1024).toFixed(1)}KB → ${(newFile.size / 1024).toFixed(1)}KB ` +
            `(${img.width}x${img.height} → ${Math.round(width)}x${Math.round(height)})`
          );

          resolve(newFile);
        },
        'image/jpeg',
        JPEG_QUALITY
      );
    };

    img.onerror = () => {
      reject(new Error('NATIVE_DECODE_FAILED'));
    };

    img.src = objectUrl;
  });
}

/**
 * 画像ファイルを圧縮する
 * HEIC/HEIFの場合:
 *   1. まずブラウザのネイティブデコードを試行（Safari等）
 *   2. 失敗したらheic-convertでソフトウェアデコード（Chrome等）
 * @param file 元の画像ファイル
 * @returns 圧縮された画像ファイル
 */
export async function compressImage(file: File): Promise<File> {
  const needsConversion = isHeicFile(file);

  // HEIC/HEIFでなく、かつ既に小さい場合はそのまま返す
  if (!needsConversion && file.size <= TARGET_SIZE_KB * 1024) {
    console.log(`Image already small enough: ${(file.size / 1024).toFixed(1)}KB`);
    return file;
  }

  if (needsConversion) {
    console.log(`Converting HEIC/HEIF to JPEG: ${file.name}`);
  }

  // まずブラウザのネイティブデコードを試行
  const objectUrl = URL.createObjectURL(file);
  try {
    return await compressViaCanvas(file, objectUrl);
  } catch (e) {
    // HEIC/HEIFでネイティブデコード失敗時のみフォールバック
    if (!needsConversion || (e instanceof Error && e.message !== 'NATIVE_DECODE_FAILED')) {
      throw e;
    }
    console.log('Native HEIC decode failed, falling back to heic-convert');
  } finally {
    URL.revokeObjectURL(objectUrl);
  }

  // フォールバック: heic-convertでソフトウェアデコード → Canvas圧縮
  const convertedFile = await convertHeicToJpeg(file);

  // 変換後のサイズが十分小さければそのまま返す
  if (convertedFile.size <= TARGET_SIZE_KB * 1024) {
    return convertedFile;
  }

  // 変換後のファイルをCanvas圧縮パイプラインに通す
  const convertedUrl = URL.createObjectURL(convertedFile);
  try {
    return await compressViaCanvas(convertedFile, convertedUrl);
  } finally {
    URL.revokeObjectURL(convertedUrl);
  }
}

/**
 * 複数の画像ファイルを並列で圧縮する
 * @param files 元の画像ファイル配列
 * @returns 圧縮された画像ファイル配列
 */
export async function compressImages(files: File[]): Promise<File[]> {
  return Promise.all(files.map(compressImage));
}
