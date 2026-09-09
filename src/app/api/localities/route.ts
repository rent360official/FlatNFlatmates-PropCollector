import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Locality from '@/models/Locality';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const cityId = searchParams.get('cityId');

    const filter: any = { isActive: true };
    if (cityId) {
      filter.cityId = cityId;
    }

    const localities = await Locality.find(filter).sort({ name: 1 }).lean();
    return NextResponse.json({ localities });
  } catch (error: any) {
    console.error('Localities error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch localities' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { cityId, name, coordinates } = body;

    if (!cityId || !name) {
      return NextResponse.json({ error: 'City and Locality name are required' }, { status: 400 });
    }

    const lng = coordinates && typeof coordinates[0] === 'number' ? coordinates[0] : 77.5946;
    const lat = coordinates && typeof coordinates[1] === 'number' ? coordinates[1] : 12.9716;

    const locality = await Locality.create({
      cityId,
      name: name.trim(),
      location: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      isActive: true,
    });

    return NextResponse.json({ success: true, locality });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create locality' }, { status: 500 });
  }
}
