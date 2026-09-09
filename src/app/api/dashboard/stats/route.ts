import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Property from '@/models/Property';
import User from '@/models/User';
import City from '@/models/City';
import Locality from '@/models/Locality';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();

    // Ensure models are registered
    void User;
    void City;
    void Locality;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    startOfWeek.setHours(0, 0, 0, 0);

    const [
      totalProperties,
      pausedProperties,
      activeProperties,
      todayCount,
      weekCount,
      recentProperties,
    ] = await Promise.all([
      Property.countDocuments({ status: { $ne: 'removed' } }),
      Property.countDocuments({ status: 'paused' }),
      Property.countDocuments({ status: 'active' }),
      Property.countDocuments({ createdAt: { $gte: startOfToday } }),
      Property.countDocuments({ createdAt: { $gte: startOfWeek } }),
      Property.find({ status: { $ne: 'removed' } })
        .sort({ createdAt: -1 })
        .limit(6)
        .populate('ownerId', 'name phone')
        .populate('cityId', 'name')
        .populate('localityId', 'name')
        .lean(),
    ]);

    return NextResponse.json({
      stats: {
        totalProperties,
        pausedProperties,
        activeProperties,
        todayCount,
        weekCount,
      },
      recentProperties,
    });
  } catch (error: any) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch stats' }, { status: 500 });
  }
}
