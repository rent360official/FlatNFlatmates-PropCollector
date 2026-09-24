import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Property from '@/models/Property';
import User from '@/models/User';
import City from '@/models/City';
import Locality from '@/models/Locality';
import { getMediaUploadConfig } from '@/lib/mediaConfig';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const { id } = params;

    const property = await Property.findById(id)
      .populate('ownerId', 'name phone email gender age profession bio verificationStatus')
      .populate('cityId', 'name state')
      .populate('localityId', 'name location')
      .lean();

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    return NextResponse.json({ property });
  } catch (error: any) {
    console.error('Property GET by ID error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch property' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const { id } = params;
    const body = await request.json();

    const existing = await Property.findById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    let {
      ownerId,
      newOwner,
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
      maintenanceAmount,
      brokerageFlag,
      brokerageAmount,
      amenities,
      houseRules,
      safetyFeatures,
      images,
      videos,
      tourVideoUrl,
      googleMapPlaceId,
      managementType,
      status,
      availableFrom,
      minLeaseMonths,
      lockInMonths,
      petPolicy,
      maxOccupants,
      parkingType,
      evChargingAvailable,
      powerBackup,
      waterSupplyType,
      internetReadiness,
      allowWhatsappContact,
      floor,
      totalFloors,
      areaSqft,
      notAvailableFields,
    } = body;

    // Handle new owner creation if owner was updated
    if (!ownerId && newOwner && newOwner.phone) {
      const cleanPhone = newOwner.phone.trim();
      let user = await User.findOne({ phone: cleanPhone });
      if (user) {
        if (newOwner.name) user.name = newOwner.name.trim();
        if (newOwner.email) user.email = newOwner.email.trim();
        user.verificationStatus = 'verified';
        await user.save();
        ownerId = user._id;
      } else {
        user = await User.create({
          phone: cleanPhone,
          name: newOwner.name?.trim() || undefined,
          email: newOwner.email?.trim() || undefined,
          role: 'owner',
          verificationStatus: 'verified',
        });
        ownerId = user._id;
      }
    }

    // Format images
    if (images) {
      const mediaConfig = await getMediaUploadConfig();
      if (images.length > mediaConfig.maxPropertyImages) {
        return NextResponse.json(
          { error: `You can upload a maximum of ${mediaConfig.maxPropertyImages} photos. You provided ${images.length}.` },
          { status: 400 }
        );
      }
    }

    const formattedImages = images
      ? images.map((img: any, idx: number) => ({
          url: typeof img === 'string' ? img : (img.processedUrls?.medium || img.url),
          isCover: img.isCover ?? idx === 0,
          fileName: img.fileName || `photo_${idx + 1}`,
          rawKey: typeof img === 'object' ? img.rawKey : undefined,
          processedUrls: typeof img === 'object' ? img.processedUrls : undefined,
          processedKeys: typeof img === 'object' ? img.processedKeys : undefined,
          type: 'image',
          status: (typeof img === 'object' && img.status) || 'ready',
          order: idx,
        }))
      : existing.images;

    const updatedData: any = {
      ...(ownerId && { ownerId }),
      ...(title && { title: title.trim() }),
      ...(description !== undefined && { description: description.trim() }),
      ...(rentAmount !== undefined && { rentAmount: Number(rentAmount) }),
      ...(depositAmount !== undefined && { depositAmount: Number(depositAmount) }),
      ...(maintenanceAmount !== undefined && { maintenanceAmount: Number(maintenanceAmount) }),
      ...(bhkConfig && { bhkConfig }),
      ...(propertyType && { propertyType }),
      ...(cityId && { cityId }),
      ...(localityId && { localityId }),
      ...(addressLine && { addressLine: addressLine.trim() }),
      ...(furnishingStatus && { furnishingStatus }),
      ...(tenantPreference && {
        tenantPreference: Array.isArray(tenantPreference)
          ? (tenantPreference.length > 0 ? tenantPreference : ['any'])
          : (tenantPreference ? [tenantPreference] : ['any']),
      }),
      ...(brokerageFlag !== undefined && { brokerageFlag: Boolean(brokerageFlag) }),
      ...(brokerageAmount !== undefined && { brokerageAmount: Number(brokerageAmount) }),
      ...(amenities !== undefined && { amenities }),
      ...(houseRules !== undefined && { houseRules }),
      ...(safetyFeatures !== undefined && { safetyFeatures }),
      ...(images !== undefined && { images: formattedImages }),
      ...(videos !== undefined && { videos }),
      ...(tourVideoUrl !== undefined && { tourVideoUrl: tourVideoUrl.trim() }),
      ...(googleMapPlaceId !== undefined && { googleMapPlaceId: googleMapPlaceId.trim() }),
      ...(managementType && { managementType }),
      ...(status && { status }),
      ...(availableFrom && { availableFrom: new Date(availableFrom) }),
      ...(minLeaseMonths !== undefined && { minLeaseMonths: Number(minLeaseMonths) }),
      ...(lockInMonths !== undefined && { lockInMonths: Number(lockInMonths) }),
      ...(petPolicy && { petPolicy }),
      ...(maxOccupants !== undefined && { maxOccupants: Number(maxOccupants) }),
      ...(parkingType && { parkingType }),
      ...(evChargingAvailable !== undefined && { evChargingAvailable: Boolean(evChargingAvailable) }),
      ...(powerBackup && { powerBackup }),
      ...(waterSupplyType && { waterSupplyType }),
      ...(internetReadiness !== undefined && { internetReadiness }),
      ...(allowWhatsappContact !== undefined && { allowWhatsappContact: Boolean(allowWhatsappContact) }),
      floor: floor !== undefined && floor !== '' ? Number(floor) : undefined,
      totalFloors: totalFloors !== undefined && totalFloors !== '' ? Number(totalFloors) : undefined,
      areaSqft: areaSqft !== undefined && areaSqft !== '' ? Number(areaSqft) : undefined,
      ...(notAvailableFields !== undefined && {
        notAvailableFields: Array.isArray(notAvailableFields) ? notAvailableFields : [],
      }),
    };

    if (location?.coordinates && Array.isArray(location.coordinates) && location.coordinates.length === 2) {
      updatedData.location = {
        type: 'Point',
        coordinates: [Number(location.coordinates[0]), Number(location.coordinates[1])],
      };
    }

    const updatedProperty = await Property.findByIdAndUpdate(id, updatedData, { new: true })
      .populate('ownerId', 'name phone email verificationStatus')
      .populate('cityId', 'name state')
      .populate('localityId', 'name')
      .lean();

    return NextResponse.json({
      success: true,
      property: updatedProperty,
      message: 'Property updated successfully',
    });
  } catch (error: any) {
    console.error('Property PUT error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update property' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const { id } = params;
    const body = await request.json();

    const allowedFields = ['status', 'isVerified', 'allowWhatsappContact'];
    const updatePayload: any = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updatePayload[field] = body[field];
      }
    }

    const updatedProperty = await Property.findByIdAndUpdate(id, updatePayload, { new: true }).lean();

    if (!updatedProperty) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      property: updatedProperty,
      message: 'Property updated',
    });
  } catch (error: any) {
    console.error('Property PATCH error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update property' }, { status: 500 });
  }
}
