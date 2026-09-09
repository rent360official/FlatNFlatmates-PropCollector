import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();

    const { phone, name, email, gender, age, profession, bio } = body;

    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: 'Phone number is mandatory' }, { status: 400 });
    }

    const cleanPhone = phone.trim();

    // Check if user already exists with this phone
    let user = await User.findOne({ phone: cleanPhone });

    if (user) {
      // Update details if provided
      if (name) user.name = name.trim();
      if (email) user.email = email.trim();
      if (gender) user.gender = gender;
      if (age) user.age = Number(age);
      if (profession) user.profession = profession.trim();
      if (bio) user.bio = bio.trim();
      user.verificationStatus = 'verified'; // Ensure verified
      await user.save();

      return NextResponse.json({
        success: true,
        user,
        isNew: false,
        message: 'Existing user updated and verified',
      });
    }

    // Create new user
    user = await User.create({
      phone: cleanPhone,
      name: name?.trim() || undefined,
      email: email?.trim() || undefined,
      gender: gender || undefined,
      age: age ? Number(age) : undefined,
      profession: profession?.trim() || undefined,
      bio: bio?.trim() || undefined,
      role: 'owner',
      verificationStatus: 'verified',
    });

    return NextResponse.json({
      success: true,
      user,
      isNew: true,
      message: 'New verified user created successfully',
    });
  } catch (error: any) {
    console.error('User creation error:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'User with this phone or email already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message || 'Failed to create user' }, { status: 500 });
  }
}
