import { NextResponse } from 'next/server';
import { getMediaUploadConfig } from '@/lib/mediaConfig';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const config = await getMediaUploadConfig();
    return NextResponse.json({ success: true, config });
  } catch (error: any) {
    console.error('Failed to get media config:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve media configuration' },
      { status: 500 }
    );
  }
}
