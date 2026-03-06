import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;

// R2クライアント（サーバーサイドのみ）
export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export const R2_BUCKET = R2_BUCKET_NAME;

// 公開URL生成
export function getPublicUrl(key: string): string {
  const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  return `${publicUrl}/${key}`;
}

// 画像アップロード
export async function uploadImage(
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  const key = `spots/${Date.now()}-${fileName}`;

  console.log('Uploading to R2:', {
    bucket: R2_BUCKET,
    key,
    contentType,
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  });

  try {
    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: file,
        ContentType: contentType,
      })
    );

    const publicUrl = getPublicUrl(key);
    console.log('Upload successful:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('R2 upload failed:', error);
    throw error;
  }
}
