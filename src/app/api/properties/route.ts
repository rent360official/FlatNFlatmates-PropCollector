import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Property from '@/models/Property';
import User from '@/models/User';
import City from '@/models/City';
import Locality from '@/models/Locality';
import { getMediaUploadConfig } from '@/lib/mediaConfig';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);

    const phone = searchParams.get('phone');
    const search = searchParams.get('search');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const filter: any = {};

    // Phone filter: lookup users with matching phone, then filter properties by ownerId
    if (phone && phone.trim()) {
      const cleanPhone = phone.trim();
      const matchingUsers = await User.find({
        phone: new RegExp(cleanPhone.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
      }).select('_id');
      const userIds = matchingUsers.map((u) => u._id);
      filter.ownerId = { $in: userIds };
    }

    // Status filter
    if (status && status !== 'all') {
      filter.status = status;
    } else {
      filter.status = { $ne: 'removed' };
    }

    // Date filter
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) {
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);
        filter.createdAt.$gte = from;
      }
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = to;
      }
    }

    // Search query (title or addressLine)
    if (search && search.trim()) {
      const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      if (!filter.ownerId) {
        filter.$or = [{ title: regex }, { addressLine: regex }];
      }
    }

    const skip = (page - 1) * limit;

    const [properties, total] = await Promise.all([
      Property.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('ownerId', 'name phone email verificationStatus')
        .populate('cityId', 'name state')
        .populate('localityId', 'name')
        .lean(),
      Property.countDocuments(filter),
    ]);

    return NextResponse.json({
      properties,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Properties GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch properties' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();

    let {
      // Owner selection / creation
      ownerId,
      newOwner,

      // Required Property fields
      title,
      description,
      rentAmount,
      depositAmount,
      bhkConfig,
      propertyType,
      cityId,
      localityId,
      addressLine,
      location,
      furnishingStatus,
      tenantPreference,

      // Optional / Defaulted fields
      maintenanceAmount = 0,
      brokerageFlag = false,
      brokerageAmount = 0,
      amenities = [],
      houseRules = [],
      safetyFeatures = [],
      images = [],
      videos = [],
      tourVideoUrl,
      googleMapPlaceId,
      managementType = 'self_managed',
      status = 'paused',
      availableFrom,
      minLeaseMonths = 11,
      lockInMonths = 0,
      petPolicy = 'case_by_case',
      maxOccupants = 2,
      parkingType = 'none',
      evChargingAvailable = false,
      powerBackup = 'none',
      waterSupplyType = 'municipal',
      internetReadiness = { fiberAvailable: false },
      allowWhatsappContact = true,
      floor,
      totalFloors,
      areaSqft,
      notAvailableFields = [],
    } = body;

    const naList = Array.isArray(notAvailableFields) ? notAvailableFields : [];
    const isNA = (k: string) => naList.includes(k);

    // 1. Handle Owner creation if newOwner object provided
    if (!ownerId && newOwner) {
      if (!newOwner.phone || !newOwner.phone.trim()) {
        return NextResponse.json(
          { error: 'Phone number is mandatory to create/link an owner' },
          { status: 400 }
        );
      }

      const cleanPhone = newOwner.phone.trim();
      let user = await User.findOne({ phone: cleanPhone });

      if (user) {
        if (newOwner.name) user.name = newOwner.name.trim();
        if (newOwner.email) user.email = newOwner.email.trim();
        if (newOwner.gender) user.gender = newOwner.gender;
        if (newOwner.age) user.age = Number(newOwner.age);
        if (newOwner.bio) user.bio = newOwner.bio.trim();
        user.verificationStatus = 'verified';
        await user.save();
        ownerId = user._id;
      } else {
        user = await User.create({
          phone: cleanPhone,
          name: newOwner.name?.trim() || undefined,
          email: newOwner.email?.trim() || undefined,
          gender: newOwner.gender || undefined,
          age: newOwner.age ? Number(newOwner.age) : undefined,
          profession: newOwner.profession?.trim() || undefined,
          bio: newOwner.bio?.trim() || undefined,
          role: 'owner',
          verificationStatus: 'verified',
        });
        ownerId = user._id;
      }
    }

    // 2. Validate mandatory schema fields
    const missingFields: string[] = [];
    if (!ownerId) missingFields.push('Owner (Select or Add New)');
    if (!isNA('title') && (!title || !title.trim())) missingFields.push('Title');
    if (!isNA('description') && (!description || !description.trim())) missingFields.push('Description');
    if (!isNA('rentAmount') && (rentAmount === undefined || rentAmount === null || rentAmount === '')) missingFields.push('Rent Amount');
    if (!isNA('depositAmount') && (depositAmount === undefined || depositAmount === null || depositAmount === '')) missingFields.push('Deposit Amount');
    if (!isNA('bhkConfig') && !bhkConfig) missingFields.push('BHK Configuration');
    if (!isNA('propertyType') && !propertyType) missingFields.push('Property Type');
    if (!cityId) missingFields.push('City');
    if (!localityId) missingFields.push('Locality');
    if (!addressLine || !addressLine.trim()) missingFields.push('Address Line');
    if (!isNA('furnishingStatus') && !furnishingStatus) missingFields.push('Furnishing Status');
    if (!isNA('tenantPreference') && (!tenantPreference || (Array.isArray(tenantPreference) && tenantPreference.length === 0))) missingFields.push('Tenant Preference');

    // Location coordinates validation
    const coordinates = location?.coordinates;
    if (
      !coordinates ||
      !Array.isArray(coordinates) ||
      coordinates.length !== 2 ||
      typeof coordinates[0] !== 'number' ||
      typeof coordinates[1] !== 'number'
    ) {
      missingFields.push('Valid Map Coordinates (Longitude, Latitude)');
    }

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: `Please fill all required fields: ${missingFields.join(', ')}`,
          missingFields,
        },
        { status: 400 }
      );
    }

    const mediaConfig = await getMediaUploadConfig();
    if (images && images.length > mediaConfig.maxPropertyImages) {
      return NextResponse.json(
        { error: `You can upload a maximum of ${mediaConfig.maxPropertyImages} photos. You provided ${images.length}.` },
        { status: 400 }
      );
    }

    // 3. Format images array cleanly
    const formattedImages = (images || []).map((img: any, idx: number) => ({
      url: typeof img === 'string' ? img : (img.processedUrls?.medium || img.url),
      isCover: img.isCover ?? idx === 0,
      fileName: img.fileName || `photo_${idx + 1}`,
      rawKey: typeof img === 'object' ? img.rawKey : undefined,
      processedUrls: typeof img === 'object' ? img.processedUrls : undefined,
      processedKeys: typeof img === 'object' ? img.processedKeys : undefined,
      type: 'image',
      status: (typeof img === 'object' && img.status) || 'ready',
      order: idx,
    }));

    // 4. Create property with default status: 'paused'
    const property = await Property.create({
      ownerId,
      title: title?.trim() || (isNA('title') ? 'Property for Rent' : 'Property Listing'),
      description: description?.trim() || (isNA('description') ? 'Information not available' : 'Property Description'),
      rentAmount: rentAmount !== undefined && rentAmount !== '' ? Number(rentAmount) : 0,
      depositAmount: depositAmount !== undefined && depositAmount !== '' ? Number(depositAmount) : 0,
      maintenanceAmount: Number(maintenanceAmount || 0),
      bhkConfig: bhkConfig || '2BHK',
      propertyType: propertyType || 'apartment',
      floor: floor !== undefined && floor !== '' ? Number(floor) : undefined,
      totalFloors: totalFloors !== undefined && totalFloors !== '' ? Number(totalFloors) : undefined,
      areaSqft: areaSqft !== undefined && areaSqft !== '' ? Number(areaSqft) : undefined,
      cityId,
      localityId,
      addressLine: addressLine.trim(),
      location: {
        type: 'Point',
        coordinates: [Number(coordinates[0]), Number(coordinates[1])],
      },
      furnishingStatus: furnishingStatus || 'unfurnished',
      tenantPreference: Array.isArray(tenantPreference)
        ? (tenantPreference.length > 0 ? tenantPreference : ['any'])
        : (tenantPreference ? [tenantPreference] : ['any']),
      brokerageFlag: Boolean(brokerageFlag),
      brokerageAmount: Number(brokerageAmount || 0),
      amenities: Array.isArray(amenities) ? amenities : [],
      houseRules: Array.isArray(houseRules) ? houseRules : [],
      safetyFeatures: Array.isArray(safetyFeatures) ? safetyFeatures : [],
      images: formattedImages,
      videos: Array.isArray(videos) ? videos : [],
      tourVideoUrl: tourVideoUrl?.trim() || undefined,
      googleMapPlaceId: googleMapPlaceId?.trim() || undefined,
      managementType: managementType || 'self_managed',
      status: status || 'paused',
      availableFrom: availableFrom ? new Date(availableFrom) : new Date(),
      minLeaseMonths: Number(minLeaseMonths || 11),
      lockInMonths: Number(lockInMonths || 0),
      petPolicy: petPolicy || 'case_by_case',
      maxOccupants: Number(maxOccupants || 2),
      parkingType: parkingType || 'none',
      evChargingAvailable: Boolean(evChargingAvailable),
      powerBackup: powerBackup || 'none',
      waterSupplyType: waterSupplyType || 'municipal',
      internetReadiness: {
        fiberAvailable: Boolean(internetReadiness?.fiberAvailable),
        avgSpeedMbps: internetReadiness?.avgSpeedMbps ? Number(internetReadiness.avgSpeedMbps) : undefined,
      },
      allowWhatsappContact: allowWhatsappContact !== false,
      isVerified: true,
      verifiedAt: new Date(),
      notAvailableFields: naList,
    });

    const populatedProperty = await Property.findById(property._id)
      .populate('ownerId', 'name phone email verificationStatus')
      .populate('cityId', 'name state')
      .populate('localityId', 'name')
      .lean();

    return NextResponse.json({
      success: true,
      property: populatedProperty,
      message: 'Property successfully registered in paused status',
    });
  } catch (error: any) {
    console.error('Property creation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to register property' }, { status: 500 });
  }
}
