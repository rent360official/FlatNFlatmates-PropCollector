import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getS3Client, getS3Config, generateMediaPaths } from '@/lib/s3';
import { getServerSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileName, fileType, mediaType = 'image', propertyId = 'collector' } = await req.json();

    if (!fileName || !fileType) {
      return NextResponse.json({ error: 'fileName and fileType are required' }, { status: 400 });
    }

    const type: 'image' | 'video' = mediaType === 'video' ? 'video' : 'image';
    const s3Client = getS3Client();
    const config = getS3Config();

    if (!s3Client || !config.bucketName) {
      return NextResponse.json(
        { error: 'AWS S3 bucket is not configured on server' },
        { status: 503 }
      );
    }

    const mediaPaths = generateMediaPaths(propertyId, fileName, type);

    const command = new PutObjectCommand({
      Bucket: config.bucketName,
      Key: mediaPaths.rawKey,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    const publicUrl = `https://${config.bucketName}.s3.${config.region}.amazonaws.com/${mediaPaths.rawKey}`;

    return NextResponse.json({
      success: true,
      uploadUrl,
      publicUrl,
      rawKey: mediaPaths.rawKey,
      mediaId: mediaPaths.uuid,
      type,
      processedKeys: (mediaPaths as any).processedKeys,
      processedUrls: (mediaPaths as any).processedUrls,
      processedKey: (mediaPaths as any).processedKey,
      processedUrl: (mediaPaths as any).processedUrl,
      thumbnailKey: (mediaPaths as any).thumbnailKey,
      thumbnailUrl: (mediaPaths as any).thumbnailUrl,
    });
  } catch (error: any) {
    console.error('S3 Upload URL generation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate upload URL' }, { status: 500 });
  }
}
