import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import City from '@/models/City';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();
    const cities = await City.find({ isActive: true }).sort({ name: 1 }).lean();
    return NextResponse.json({ cities });
  } catch (error: any) {
    console.error('Cities error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch cities' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { name, state } = body;

    if (!name || !state) {
      return NextResponse.json({ error: 'City name and state are required' }, { status: 400 });
    }

    const city = await City.create({
      name: name.trim(),
      state: state.trim(),
      isActive: true,
    });

    return NextResponse.json({ success: true, city });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create city' }, { status: 500 });
  }
}
