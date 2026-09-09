import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    void User;
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    if (!query.trim()) {
      // Return 10 most recently active users/owners
      const users = await User.find()
        .sort({ updatedAt: -1 })
        .limit(10)
        .select('_id name phone email verificationStatus role')
        .lean();
      return NextResponse.json({ users });
    }

    const cleanQuery = query.trim();
    const regex = new RegExp(cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const users = await User.find({
      $or: [{ phone: regex }, { name: regex }, { email: regex }],
    })
      .limit(15)
      .select('_id name phone email verificationStatus role')
      .lean();

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('User search error:', error);
    return NextResponse.json({ error: error.message || 'Failed to search users' }, { status: 500 });
  }
}
