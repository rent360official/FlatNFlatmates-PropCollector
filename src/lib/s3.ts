import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export function getS3Config() {
  return {
    region: process.env.AWS_REGION || 'ap-south-1',
    bucketName: process.env.AWS_S3_BUCKET_NAME,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
}

let s3Client: S3Client | null = null;

export function getS3Client(): S3Client | null {
  if (s3Client) return s3Client;

  const config = getS3Config();

  if (!config.accessKeyId || !config.secretAccessKey || !config.bucketName) {
    return null;
  }

  s3Client = new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return s3Client;
}

export function buildS3Url(key: string): string {
  const config = getS3Config();
  if (!config.bucketName) return '';
  return `https://${config.bucketName}.s3.${config.region}.amazonaws.com/${key}`;
}

export function generateMediaPaths(propertyId: string, fileName: string, mediaType: 'image' | 'video') {
  const cleanName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const uuid = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

  if (mediaType === 'image') {
    const rawKey = `raw/images/${propertyId}/${uuid}_${cleanName}`;
    const baseProcessedKey = `processed/images/${propertyId}/${uuid}`;
    const processedKeys = {
      thumb: `${baseProcessedKey}-thumb.webp`,
      medium: `${baseProcessedKey}-medium.webp`,
      full: `${baseProcessedKey}-full.webp`,
    };
    const processedUrls = {
      thumb: buildS3Url(processedKeys.thumb),
      medium: buildS3Url(processedKeys.medium),
      full: buildS3Url(processedKeys.full),
    };
    return {
      uuid,
      rawKey,
      processedKeys,
      processedUrls,
    };
  } else {
    const rawKey = `raw/videos/${propertyId}/${uuid}_${cleanName}`;
    const baseProcessedKey = `processed/videos/${propertyId}/${uuid}`;
    const processedKey = `${baseProcessedKey}-720p.mp4`;
    const thumbnailKey = `${baseProcessedKey}-thumb.jpg`;
    return {
      uuid,
      rawKey,
      processedKey,
      processedUrl: buildS3Url(processedKey),
      thumbnailKey,
      thumbnailUrl: buildS3Url(thumbnailKey),
    };
  }
}
