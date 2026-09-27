import { GoogleGenAI, Type, Schema } from '@google/genai';

export interface ExtractedPropertyData {
  title?: string | null;
  description?: string | null;
  propertyType?: 'apartment' | 'house' | 'villa' | 'pg_hostel' | null;
  bhkConfig?: '1RK' | '1BHK' | '2BHK' | '3BHK' | '4BHK+' | null;
  furnishingStatus?: 'fully_furnished' | 'semi_furnished' | 'unfurnished' | null;
  tenantPreference?: ('family' | 'bachelors' | 'girls' | 'boys' | 'any')[];
  floor?: number | null;
  totalFloors?: number | null;
  areaSqft?: number | null;
  cityName?: string | null;
  localityName?: string | null;
  addressLine?: string | null;
  rentAmount?: number | null;
  depositAmount?: number | null;
  maintenanceAmount?: number | null;
  brokerageFlag?: boolean | null;
  brokerageAmount?: number | null;
  availableFrom?: string | null;
  minLeaseMonths?: number | null;
  lockInMonths?: number | null;
  amenities?: string[];
  houseRules?: string[];
  safetyFeatures?: string[];
  powerBackup?: 'none' | 'partial' | 'full' | null;
  waterSupplyType?: 'municipal' | 'borewell' | 'tanker' | 'mixed' | null;
  parkingType?: 'none' | 'two_wheeler' | 'four_wheeler' | 'both' | null;
  evChargingAvailable?: boolean | null;
  petPolicy?: 'allowed' | 'not_allowed' | 'case_by_case' | null;
  maxOccupants?: number | null;
  fiberAvailable?: boolean | null;
  avgSpeedMbps?: number | null;
}

export interface ExtractionResult {
  data: ExtractedPropertyData;
  warnings: string[];
  modelUsed: string;
}

const PROPERTY_EXTRACTION_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: 'Catchy and descriptive listing title for the property' },
    description: { type: Type.STRING, description: 'Full description of the property, locality, and highlights' },
    propertyType: {
      type: Type.STRING,
      enum: ['apartment', 'house', 'villa', 'pg_hostel'],
      description: 'Type of property: apartment, house, villa, or pg_hostel',
    },
    bhkConfig: {
      type: Type.STRING,
      enum: ['1RK', '1BHK', '2BHK', '3BHK', '4BHK+'],
      description: 'BHK configuration: 1RK, 1BHK, 2BHK, 3BHK, or 4BHK+',
    },
    furnishingStatus: {
      type: Type.STRING,
      enum: ['fully_furnished', 'semi_furnished', 'unfurnished'],
      description: 'Furnishing state: fully_furnished, semi_furnished, or unfurnished',
    },
    tenantPreference: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
        enum: ['family', 'bachelors', 'girls', 'boys', 'any'],
      },
      description: 'Tenant suitability preferences',
    },
    floor: { type: Type.INTEGER, description: 'Floor number on which the unit is located (e.g. 3, 0 for ground)' },
    totalFloors: { type: Type.INTEGER, description: 'Total number of floors in the building/society (e.g. 12)' },
    areaSqft: { type: Type.NUMBER, description: 'Built-up / super built-up / carpet area in sq. ft. (numeric only, e.g. 959)' },
    cityName: { type: Type.STRING, description: 'City name where property is located (e.g. Pune, Bangalore, Mumbai, Delhi NCR, Hyderabad)' },
    localityName: { type: Type.STRING, description: 'Locality / Area / Neighborhood name (e.g. Kharadi, Whitefield, HSR Layout, Indiranagar, Powai, Wakad)' },
    addressLine: { type: Type.STRING, description: 'Street address, society name, or landmark location (e.g. SG Lanke Vishwajeet Residency, Tulaja Bhawani Nagar, Kharadi)' },
    rentAmount: { type: Type.NUMBER, description: 'Monthly rent amount in Indian Rupees (INR) (numeric only, e.g. 33000)' },
    depositAmount: { type: Type.NUMBER, description: 'Security deposit amount in Indian Rupees (INR) (numeric only, e.g. 75000)' },
    maintenanceAmount: { type: Type.NUMBER, description: 'Monthly maintenance charges in INR (numeric, 0 if included in rent or none)' },
    brokerageFlag: { type: Type.BOOLEAN, description: 'True if brokerage is applicable, false if zero brokerage or direct owner' },
    brokerageAmount: { type: Type.NUMBER, description: 'Brokerage fee amount if specified (0 if none)' },
    availableFrom: { type: Type.STRING, description: 'Available from date in YYYY-MM-DD format (e.g. 2026-07-21) or "Immediately"' },
    minLeaseMonths: { type: Type.INTEGER, description: 'Minimum lease period in months (standard default is 11)' },
    lockInMonths: { type: Type.INTEGER, description: 'Lock-in period in months (0 if not mentioned)' },
    amenities: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'List of amenities and individual furnishing items present in the property (e.g. WiFi, Air Conditioner, Refrigerator, Washing Machine, Geyser, Television, Lift, Power Backup, Gym, Swimming Pool, Covered Parking, Security Guard, CCTV, Balcony, Modular Kitchen, Fans, Lights)',
    },
    houseRules: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'House rules mentioned (e.g. No Smoking inside, No Loud Music after 10 PM, Pets Allowed, Visitors Allowed, Veg Cooking Only)',
    },
    safetyFeatures: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Safety and security features (e.g. Gated Community, 24/7 Security Guard, CCTV Surveillance, Fire Extinguisher, Intercom Facility)',
    },
    powerBackup: {
      type: Type.STRING,
      enum: ['none', 'partial', 'full'],
      description: 'Power backup facility: none, partial, or full',
    },
    waterSupplyType: {
      type: Type.STRING,
      enum: ['municipal', 'borewell', 'tanker', 'mixed'],
      description: 'Water source type: municipal, borewell, tanker, or mixed',
    },
    parkingType: {
      type: Type.STRING,
      enum: ['none', 'two_wheeler', 'four_wheeler', 'both'],
      description: 'Vehicle parking availability: none, two_wheeler, four_wheeler, or both',
    },
    evChargingAvailable: { type: Type.BOOLEAN, description: 'Whether EV charging is available' },
    petPolicy: {
      type: Type.STRING,
      enum: ['allowed', 'not_allowed', 'case_by_case'],
      description: 'Pet policy: allowed, not_allowed, or case_by_case',
    },
    maxOccupants: { type: Type.INTEGER, description: 'Maximum allowed occupants' },
    fiberAvailable: { type: Type.BOOLEAN, description: 'High speed fiber internet availability' },
    avgSpeedMbps: { type: Type.NUMBER, description: 'Average internet speed in Mbps if stated' },
  },
};

const SYSTEM_INSTRUCTION = `
You are an expert real estate data extraction assistant for "Property Collector" (FlatNFlatmates admin app).
You are provided with raw text and JSON-LD metadata extracted from a real estate listing webpage.

CRITICAL INSTRUCTIONS:
1. SINGLE PRIMARY PROPERTY ONLY:
   The webpage may contain ONE primary property listing being viewed, plus unrelated suggested/recommended listings or ads.
   You must extract information ONLY for the SINGLE MAIN/PRIMARY property on this page.
   STRICTLY IGNORE all suggested/recommended/similar listings.

2. EXACT FIELD NAMING & TYPES:
   Strictly output valid JSON matching the schema properties:
   - rentAmount: Monthly rent number (e.g. 33000 for 33k/month)
   - depositAmount: Security deposit number (e.g. 75000)
   - areaSqft: Built-up / carpet area number in sq. ft. (e.g. 959)
   - cityName: City name (e.g. Pune, Bangalore, Mumbai)
   - localityName: Locality / Sub-locality (e.g. Kharadi, Wakad, Whitefield)
   - addressLine: Building / Society name and street address (e.g. SG Lanke Vishwajeet Residency, Tulaja Bhawani Nagar, Kharadi)
   - bhkConfig: "1RK" | "1BHK" | "2BHK" | "3BHK" | "4BHK+"
   - propertyType: "apartment" | "house" | "villa" | "pg_hostel"
   - furnishingStatus: "fully_furnished" | "semi_furnished" | "unfurnished"
   - tenantPreference: list of "family" | "bachelors" | "girls" | "boys" | "any"
   - floor: Integer floor number if stated
   - totalFloors: Integer total floors in building if stated
   - powerBackup: "none" | "partial" | "full"
   - waterSupplyType: "municipal" | "borewell" | "tanker" | "mixed"
   - parkingType: "none" | "two_wheeler" | "four_wheeler" | "both"
   - petPolicy: "allowed" | "not_allowed" | "case_by_case"
   - availableFrom: "YYYY-MM-DD" or "Immediately"
   - amenities: List of all amenities, society facilities, and appliances/furnishings

3. EXCLUSIONS:
   - DO NOT extract any image URLs, photo links, or media URLs.
   - DO NOT extract owner/agent/broker contact numbers, personal names, or email addresses.

4. NO FABRICATIONS:
   If a field is not mentioned on the page, set it to null. Do not invent arbitrary figures.
`;

/**
 * Calls Gemini API with structured JSON output schema.
 */
export async function extractPropertyWithGemini(pageContent: string): Promise<ExtractionResult> {
  const apiKey =
    process.env.GOOGLE_AI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error(
      'Google AI API key is not configured. Please set GOOGLE_AI_API_KEY in your environment variables.'
    );
  }

  // Resolve model name (auto-upgrade deprecated models to gemini-3.8-flash)
  let modelName =
    process.env.GEMINI_MODEL ||
    process.env.GOOGLE_AI_MODEL ||
    'gemini-3.8-flash';

  if (
    modelName.includes('2.5') ||
    modelName.includes('1.5') ||
    modelName.includes('2.0')
  ) {
    modelName = 'gemini-3.8-flash';
  }

  let rawJson = '';

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Use models.generateContent with responseSchema for guaranteed structured output
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Here is the extracted property listing webpage content. Extract the primary property details into the structured format conforming to the schema:\n\n${pageContent}`,
            },
          ],
        },
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: PROPERTY_EXTRACTION_SCHEMA,
        temperature: 0.1,
      },
    });

    rawJson = response.text || '';
  } catch (sdkErr: any) {
    console.warn('Gemini SDK call failed, attempting REST API fallback:', sdkErr.message);
    try {
      const restRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: `${SYSTEM_INSTRUCTION}\n\nHere is the extracted property listing webpage content. Extract the primary property details:\n\n${pageContent}`,
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.1,
            },
          }),
        }
      );

      if (!restRes.ok) {
        const errData = await restRes.json().catch(() => ({}));
        throw new Error(
          errData?.error?.message || `Google AI service error (HTTP ${restRes.status}).`
        );
      }

      const restJson = await restRes.json();
      rawJson = restJson?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (restErr: any) {
      if (
        restErr.message?.includes('API_KEY_INVALID') ||
        restErr.message?.includes('403') ||
        restErr.message?.includes('401')
      ) {
        throw new Error('Google AI API Key is invalid or does not have access to Generative Language API.');
      }
      if (restErr.message?.includes('RESOURCE_EXHAUSTED') || restErr.message?.includes('429')) {
        throw new Error('Google AI API rate limit reached. Please try again in a moment.');
      }
      throw new Error(`AI service unavailable: ${restErr.message || sdkErr.message || 'Please fill the form manually.'}`);
    }
  }

  if (!rawJson) {
    throw new Error('AI returned an empty response for this property page.');
  }

  // Parse and validate JSON
  let parsed: any;
  try {
    const cleanJson = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
    parsed = JSON.parse(cleanJson);
  } catch (parseErr: any) {
    throw new Error('Failed to parse AI output into valid property structure.');
  }

  const sanitized = sanitizeExtractedData(parsed);

  // Generate audit warnings for missing essential fields
  const warnings: string[] = [];
  if (!sanitized.rentAmount || sanitized.rentAmount <= 0) {
    warnings.push('Rent amount was not clearly specified on the page and was left blank.');
  }
  if (!sanitized.localityName && !sanitized.addressLine) {
    warnings.push('Locality / address could not be identified with certainty.');
  }
  if (!sanitized.bhkConfig) {
    warnings.push('BHK configuration was not identified.');
  }
  if (!sanitized.areaSqft) {
    warnings.push('Area / square footage was not specified.');
  }

  console.log(`\n=================== [GEMINI AI EXTRACTION OUTPUT] ===================`);
  console.log(`Model Used: ${modelName}`);
  console.log(`Raw AI JSON:\n`, rawJson);
  console.log(`Sanitized Structured Property Data:\n`, JSON.stringify(sanitized, null, 2));
  if (warnings.length > 0) {
    console.log(`Warnings:\n`, warnings);
  }
  console.log(`======================================================================\n`);

  return {
    data: sanitized,
    warnings,
    modelUsed: modelName,
  };
}

/**
 * Cleans, sanitizes, and normalizes extracted data to match application models strictly,
 * with comprehensive alias fallback to ensure no extracted field is dropped.
 */
function sanitizeExtractedData(data: any): ExtractedPropertyData {
  if (!data || typeof data !== 'object') return {};

  const clean: ExtractedPropertyData = {};

  // Title
  if (typeof data.title === 'string' && data.title.trim()) {
    clean.title = data.title.trim();
  }

  // Description
  if (typeof data.description === 'string' && data.description.trim()) {
    clean.description = data.description.trim();
  }

  // Property Type
  const rawType = String(data.propertyType || data.type || '').toLowerCase();
  if (rawType.includes('apartment') || rawType.includes('flat') || rawType.includes('condo')) {
    clean.propertyType = 'apartment';
  } else if (rawType.includes('house') || rawType.includes('independent')) {
    clean.propertyType = 'house';
  } else if (rawType.includes('villa')) {
    clean.propertyType = 'villa';
  } else if (rawType.includes('pg') || rawType.includes('hostel') || rawType.includes('co-living')) {
    clean.propertyType = 'pg_hostel';
  }

  // BHK Config
  const rawBhk = String(
    data.bhkConfig ||
      data.bhk ||
      (data.bedrooms ? `${data.bedrooms}BHK` : '') ||
      (data.title ? data.title : '')
  ).toUpperCase().replace(/\s+/g, '');

  if (rawBhk.includes('1RK')) {
    clean.bhkConfig = '1RK';
  } else if (rawBhk.includes('1BHK') || rawBhk.includes('1BEDROOM') || rawBhk === '1') {
    clean.bhkConfig = '1BHK';
  } else if (rawBhk.includes('2BHK') || rawBhk.includes('2BEDROOM') || rawBhk === '2') {
    clean.bhkConfig = '2BHK';
  } else if (rawBhk.includes('3BHK') || rawBhk.includes('3BEDROOM') || rawBhk === '3') {
    clean.bhkConfig = '3BHK';
  } else if (
    rawBhk.includes('4BHK') ||
    rawBhk.includes('5BHK') ||
    rawBhk.includes('4BEDROOM') ||
    rawBhk.includes('5BEDROOM') ||
    rawBhk.includes('4BHK+')
  ) {
    clean.bhkConfig = '4BHK+';
  }

  // Furnishing Status
  const rawFurnish = String(data.furnishingStatus || data.furnishing || data.furnishType || '').toLowerCase().replace(/[-\s]/g, '_');
  if (rawFurnish.includes('fully') || rawFurnish === 'furnished') {
    clean.furnishingStatus = 'fully_furnished';
  } else if (rawFurnish.includes('semi')) {
    clean.furnishingStatus = 'semi_furnished';
  } else if (rawFurnish.includes('unfurnish') || rawFurnish === 'none' || rawFurnish === 'bare') {
    clean.furnishingStatus = 'unfurnished';
  }

  // Tenant Preferences
  const rawTenant = data.tenantPreference || data.tenants || data.preferredTenant;
  if (Array.isArray(rawTenant)) {
    const validPrefs = ['family', 'bachelors', 'girls', 'boys', 'any'];
    const filtered = rawTenant.map((t) => String(t).toLowerCase().trim()).filter((p) => validPrefs.includes(p));
    clean.tenantPreference = filtered.length > 0 ? (filtered as any) : ['any'];
  } else if (typeof rawTenant === 'string' && rawTenant.trim()) {
    const lower = rawTenant.toLowerCase();
    if (lower.includes('family')) clean.tenantPreference = ['family'];
    else if (lower.includes('bachelor')) clean.tenantPreference = ['bachelors'];
    else if (lower.includes('girl') || lower.includes('female')) clean.tenantPreference = ['girls'];
    else if (lower.includes('boy') || lower.includes('male')) clean.tenantPreference = ['boys'];
    else clean.tenantPreference = ['any'];
  }

  // Floor
  const rawFloor = data.floor ?? data.floorNumber ?? data.floorNo;
  if (rawFloor !== undefined && rawFloor !== null) {
    const num = typeof rawFloor === 'number' ? rawFloor : parseInt(String(rawFloor).replace(/[^0-9-]/g, ''), 10);
    if (!isNaN(num)) clean.floor = num;
  }

  // Total Floors
  const rawTotalFloors = data.totalFloors ?? data.totalFloor ?? data.floors ?? data.buildingFloors;
  if (rawTotalFloors !== undefined && rawTotalFloors !== null) {
    const num = typeof rawTotalFloors === 'number' ? rawTotalFloors : parseInt(String(rawTotalFloors).replace(/[^0-9]/g, ''), 10);
    if (!isNaN(num)) clean.totalFloors = num;
  }

  // Area (Sq Ft)
  const rawArea = data.areaSqft ?? data.builtUpArea ?? data.superBuiltUpArea ?? data.carpetArea ?? data.area ?? data.size;
  if (rawArea !== undefined && rawArea !== null) {
    const num = typeof rawArea === 'number' ? rawArea : parseFloat(String(rawArea).replace(/[^0-9.]/g, ''));
    if (!isNaN(num) && num > 0) clean.areaSqft = Math.round(num);
  }

  // Rent Amount (INR)
  const rawRent = data.rentAmount ?? data.rent ?? data.monthlyRent ?? data.price ?? data.rentPrice ?? data.cost;
  if (rawRent !== undefined && rawRent !== null) {
    const num = typeof rawRent === 'number' ? rawRent : parseFloat(String(rawRent).replace(/[^0-9.]/g, ''));
    if (!isNaN(num) && num > 0) clean.rentAmount = Math.round(num);
  }

  // Deposit Amount (INR)
  const rawDeposit = data.depositAmount ?? data.securityDeposit ?? data.deposit;
  if (rawDeposit !== undefined && rawDeposit !== null) {
    const num = typeof rawDeposit === 'number' ? rawDeposit : parseFloat(String(rawDeposit).replace(/[^0-9.]/g, ''));
    if (!isNaN(num) && num >= 0) clean.depositAmount = Math.round(num);
  }

  // Maintenance Amount (INR)
  const rawMaint = data.maintenanceAmount ?? data.maintenance ?? data.maintenanceCharge;
  if (rawMaint !== undefined && rawMaint !== null) {
    const num = typeof rawMaint === 'number' ? rawMaint : parseFloat(String(rawMaint).replace(/[^0-9.]/g, ''));
    if (!isNaN(num) && num >= 0) clean.maintenanceAmount = Math.round(num);
  }

  // Brokerage Amount & Flag
  const rawBrok = data.brokerageAmount ?? data.brokerageFee ?? data.brokerage;
  if (typeof rawBrok === 'number' && !isNaN(rawBrok)) {
    clean.brokerageAmount = Math.round(rawBrok);
    clean.brokerageFlag = rawBrok > 0;
  } else if (typeof data.brokerageFlag === 'boolean') {
    clean.brokerageFlag = data.brokerageFlag;
  }

  // Lease Durations
  const rawMinLease = data.minLeaseMonths ?? data.leasePeriod ?? data.minimumLease;
  if (rawMinLease !== undefined && rawMinLease !== null) {
    const num = typeof rawMinLease === 'number' ? rawMinLease : parseInt(String(rawMinLease).replace(/[^0-9]/g, ''), 10);
    if (!isNaN(num)) clean.minLeaseMonths = num;
  }

  const rawLockIn = data.lockInMonths ?? data.lockInPeriod ?? data.lockin;
  if (rawLockIn !== undefined && rawLockIn !== null) {
    const num = typeof rawLockIn === 'number' ? rawLockIn : parseInt(String(rawLockIn).replace(/[^0-9]/g, ''), 10);
    if (!isNaN(num)) clean.lockInMonths = num;
  }

  // Max Occupants
  const rawOcc = data.maxOccupants ?? data.occupancy ?? data.maxGuests;
  if (rawOcc !== undefined && rawOcc !== null) {
    const num = typeof rawOcc === 'number' ? rawOcc : parseInt(String(rawOcc).replace(/[^0-9]/g, ''), 10);
    if (!isNaN(num)) clean.maxOccupants = num;
  }

  // Internet Readiness
  if (typeof data.fiberAvailable === 'boolean') clean.fiberAvailable = data.fiberAvailable;
  if (typeof data.avgSpeedMbps === 'number' && !isNaN(data.avgSpeedMbps)) clean.avgSpeedMbps = data.avgSpeedMbps;
  if (typeof data.evChargingAvailable === 'boolean') clean.evChargingAvailable = data.evChargingAvailable;

  // City Name
  const rawCity = data.cityName ?? data.city;
  if (typeof rawCity === 'string' && rawCity.trim()) clean.cityName = rawCity.trim();

  // Locality Name
  const rawLoc = data.localityName ?? data.locality ?? data.neighborhood ?? data.subLocality ?? data.areaName;
  if (typeof rawLoc === 'string' && rawLoc.trim()) clean.localityName = rawLoc.trim();

  // Address Line / Street / Society
  const rawAddr = data.addressLine ?? data.streetAddress ?? data.address ?? data.societyName ?? data.society;
  if (typeof rawAddr === 'string' && rawAddr.trim()) {
    clean.addressLine = rawAddr.trim();
  }

  // Available From Date Normalization (Format: YYYY-MM-DD)
  const rawAvail = data.availableFrom ?? data.possessionDate ?? data.availableDate;
  if (typeof rawAvail === 'string' && rawAvail.trim()) {
    const val = rawAvail.trim();
    if (val.toLowerCase().includes('immediate') || val.toLowerCase().includes('ready')) {
      clean.availableFrom = new Date().toISOString().split('T')[0];
    } else {
      const parsedDate = new Date(val);
      if (!isNaN(parsedDate.getTime())) {
        clean.availableFrom = parsedDate.toISOString().split('T')[0];
      } else {
        clean.availableFrom = val;
      }
    }
  }

  // Enums
  const rawPower = String(data.powerBackup || '').toLowerCase();
  if (rawPower.includes('full') || rawPower.includes('100') || rawPower.includes('24x7') || rawPower.includes('24*7')) {
    clean.powerBackup = 'full';
  } else if (rawPower.includes('partial') || rawPower.includes('yes') || rawPower.includes('available')) {
    clean.powerBackup = 'partial';
  } else if (rawPower.includes('none') || rawPower.includes('no')) {
    clean.powerBackup = 'none';
  }

  const rawWater = String(data.waterSupplyType || data.waterSupply || '').toLowerCase();
  if (rawWater.includes('mixed') || (rawWater.includes('borewell') && rawWater.includes('municipal'))) {
    clean.waterSupplyType = 'mixed';
  } else if (rawWater.includes('cauvery') || rawWater.includes('municipal') || rawWater.includes('corporation')) {
    clean.waterSupplyType = 'municipal';
  } else if (rawWater.includes('borewell')) {
    clean.waterSupplyType = 'borewell';
  } else if (rawWater.includes('tanker')) {
    clean.waterSupplyType = 'tanker';
  }

  const rawParking = String(data.parkingType || data.parking || '').toLowerCase();
  if (rawParking.includes('both') || (rawParking.includes('car') && rawParking.includes('bike')) || (rawParking.includes('two') && rawParking.includes('four'))) {
    clean.parkingType = 'both';
  } else if (rawParking.includes('four') || rawParking.includes('car') || rawParking.includes('covered')) {
    clean.parkingType = 'four_wheeler';
  } else if (rawParking.includes('two') || rawParking.includes('bike') || rawParking.includes('scooter')) {
    clean.parkingType = 'two_wheeler';
  } else if (rawParking.includes('none') || rawParking.includes('no')) {
    clean.parkingType = 'none';
  }

  const rawPet = String(data.petPolicy || data.pets || '').toLowerCase();
  if (rawPet.includes('not') || rawPet.includes('no')) {
    clean.petPolicy = 'not_allowed';
  } else if (rawPet.includes('case') || rawPet.includes('discuss')) {
    clean.petPolicy = 'case_by_case';
  } else if (rawPet.includes('allow') || rawPet.includes('yes')) {
    clean.petPolicy = 'allowed';
  }

  // Merge Amenities & Furnishing items
  const combinedAmenities: string[] = [
    ...(Array.isArray(data.amenities) ? data.amenities : []),
    ...(Array.isArray(data.furnishings) ? data.furnishings : []),
  ];
  if (combinedAmenities.length > 0) {
    clean.amenities = Array.from(new Set(combinedAmenities.map((a) => String(a).trim()).filter(Boolean)));
  }

  if (Array.isArray(data.houseRules)) {
    clean.houseRules = Array.from(new Set(data.houseRules.map((r: any) => String(r).trim()).filter(Boolean)));
  }

  if (Array.isArray(data.safetyFeatures)) {
    clean.safetyFeatures = Array.from(new Set(data.safetyFeatures.map((s: any) => String(s).trim()).filter(Boolean)));
  }

  return clean;
}

