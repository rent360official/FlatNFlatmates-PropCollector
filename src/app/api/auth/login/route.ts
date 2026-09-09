import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken, setSessionCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    const envUsername = process.env.ADMIN_USERNAME || process.env.ADMIN_ID || 'admin';
    const envPassword = process.env.ADMIN_PASSWORD || 'adminpassword123';

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Admin ID / Username and Password are required' },
        { status: 400 }
      );
    }

    if (username.trim() !== envUsername.trim() || password !== envPassword) {
      return NextResponse.json(
        { error: 'Invalid Admin credentials' },
        { status: 401 }
      );
    }

    const token = await createSessionToken(username.trim());
    const response = NextResponse.json({
      success: true,
      user: {
        username: username.trim(),
        role: 'collector_admin',
      },
    });

    setSessionCookie(response, token);
    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
