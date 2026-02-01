/**
 * 画像圧縮ユーティリティ
 * Vercel Hobbyプランのボディサイズ制限（4.5MB）対策
 */

// 圧縮設定
const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1920;
const JPEG_QUALITY = 0.8;
const TARGET_SIZE_KB = 1000; // 目標サイズ: 1MB以下

/**
 * 画像ファイルを圧縮する
 * @param file 元の画像ファイル
 * @returns 圧縮された画像ファイル
 */
export async function compressImage(file: File): Promise<File> {
  // 既に小さい場合はそのまま返す
  if (file.size <= TARGET_SIZE_KB * 1024) {
    console.log(`Image already small enough: ${(file.size / 1024).toFixed(1)}KB`);
    return file;
  }

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

          // ファイル名を生成（元のファイル名を維持しつつ拡張子をjpgに）
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
      reject(new Error('Failed to load image'));
    };

    // FileをDataURLに変換して読み込み
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * 複数の画像ファイルを並列で圧縮する
 * @param files 元の画像ファイル配列
 * @returns 圧縮された画像ファイル配列
 */
export async function compressImages(files: File[]): Promise<File[]> {
  return Promise.all(files.map(compressImage));
}
