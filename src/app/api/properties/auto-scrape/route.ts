import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { validateScrapeUrl } from '@/lib/scraper/security';
import { checkRateLimit } from '@/lib/scraper/rateLimit';
import { scrapePropertyPage } from '@/lib/scraper/fetcher';
import { extractPropertyWithGemini } from '@/lib/ai/geminiExtractor';
import { logScrapeAttempt } from '@/lib/scraper/logger';
import dbConnect from '@/lib/db';
import City from '@/models/City';
import Locality from '@/models/Locality';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow sufficient execution window for scraper & AI

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let adminUsername = 'anonymous_admin';
  let targetUrl = '';

  try {
    // 1. Session check
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }
    adminUsername = session.username || 'collector_admin';

    // 2. Rate limiting check (e.g. 20 requests/minute per admin user/IP)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'ip_unknown';
    const rateLimitKey = `${adminUsername}:${ip}`;
    const rateLimit = checkRateLimit(rateLimitKey, 20, 60);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Rate limit exceeded. Please wait ${rateLimit.resetSeconds}s before attempting another scrape.`,
        },
        { status: 429 }
      );
    }

    // 3. Body validation
    const body = await request.json().catch(() => ({}));
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'A valid listing URL is required.' },
        { status: 400 }
      );
    }
    targetUrl = url.trim();

    // 4. SSRF & URL validation
    const urlValidation = await validateScrapeUrl(targetUrl);
    if (!urlValidation.isValid || !urlValidation.sanitizedUrl) {
      return NextResponse.json(
        { error: urlValidation.error || 'Invalid or forbidden URL.' },
        { status: 400 }
      );
    }
    const safeUrl = urlValidation.sanitizedUrl;

    // 5. Scrape webpage content (HTTP + Playwright fallback)
    const scrapeResult = await scrapePropertyPage(safeUrl);

    // 6. Gemini AI Extraction
    const aiResult = await extractPropertyWithGemini(scrapeResult.text);

    // 7. DB Lookup: Match City & Locality to system IDs
    let matchedCityId: string | null = null;
    let matchedLocalityId: string | null = null;
    let locationCoordinates: [number, number] | null = null;

    try {
      await dbConnect();

      let cityDoc: any = null;
      if (aiResult.data.cityName) {
        const cleanCityName = aiResult.data.cityName.trim();
        cityDoc = await City.findOne({
          name: { $regex: new RegExp(`^${cleanCityName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        });

        if (!cityDoc) {
          cityDoc = await City.findOne({
            name: { $regex: new RegExp(cleanCityName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
          });
        }
      }

      // If city still not found, try matching city name from title or address
      if (!cityDoc) {
        const allCities = await City.find({ isActive: true });
        for (const c of allCities) {
          const cName = c.name.toLowerCase();
          if (
            (aiResult.data.addressLine && aiResult.data.addressLine.toLowerCase().includes(cName)) ||
            (aiResult.data.title && aiResult.data.title.toLowerCase().includes(cName))
          ) {
            cityDoc = c;
            break;
          }
        }
      }

      if (cityDoc) {
        matchedCityId = cityDoc._id.toString();

        // Try matching locality within this city
        const rawLoc = aiResult.data.localityName?.trim() || '';
        let locDoc: any = null;

        if (rawLoc) {
          // 1. Direct match
          locDoc = await Locality.findOne({
            cityId: cityDoc._id,
            name: { $regex: new RegExp(`^${rawLoc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
          });

          if (!locDoc) {
            locDoc = await Locality.findOne({
              cityId: cityDoc._id,
              name: { $regex: new RegExp(rawLoc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
            });
          }

          // 2. Tokenized match if comma or hyphen exists
          if (!locDoc && (rawLoc.includes(',') || rawLoc.includes('-') || rawLoc.includes('/'))) {
            const tokens = rawLoc.split(/[,/-]/).map((t) => t.trim()).filter(Boolean);
            for (const token of tokens) {
              locDoc = await Locality.findOne({
                cityId: cityDoc._id,
                name: { $regex: new RegExp(`^${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
              });
              if (locDoc) break;
            }
          }
        }

        // 3. Substring match across all localities in the city
        if (!locDoc) {
          const cityLocalities = await Locality.find({ cityId: cityDoc._id, isActive: true });
          const searchText = `${rawLoc} ${aiResult.data.addressLine || ''} ${aiResult.data.title || ''}`.toLowerCase();
          for (const l of cityLocalities) {
            if (searchText.includes(l.name.toLowerCase())) {
              locDoc = l;
              break;
            }
          }
        }

        if (locDoc) {
          matchedLocalityId = locDoc._id.toString();
          if (locDoc.location?.coordinates) {
            locationCoordinates = locDoc.location.coordinates;
          }
        }
      }
    } catch (dbErr: any) {
      console.warn('City/Locality DB lookup warning:', dbErr.message);
    }

    const durationMs = Date.now() - startTime;

    // 8. Audit logging
    logScrapeAttempt({
      timestamp: new Date().toISOString(),
      adminUsername,
      url: safeUrl,
      status: 'SUCCESS',
      durationMs,
      method: scrapeResult.method,
      contentLength: scrapeResult.text.length,
      modelUsed: aiResult.modelUsed,
    });

    const finalPayload = {
      ...aiResult.data,
      cityId: matchedCityId,
      localityId: matchedLocalityId,
      lat: locationCoordinates ? locationCoordinates[1] : undefined,
      lng: locationCoordinates ? locationCoordinates[0] : undefined,
    };

    console.log(`[AUTO-SCRAPE RESPONSE SENT TO FRONTEND]:\n`, JSON.stringify(finalPayload, null, 2));

    return NextResponse.json({
      success: true,
      data: finalPayload,
      warnings: aiResult.warnings || [],
      sourceUrl: safeUrl,
      method: scrapeResult.method,
    });
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    logScrapeAttempt({
      timestamp: new Date().toISOString(),
      adminUsername,
      url: targetUrl || 'unknown',
      status: 'FAILED',
      durationMs,
      errorMessage: error.message || 'Unknown error',
    });

    console.error('Auto-Scrape endpoint error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to auto-scrape property listing.',
      },
      { status: 500 }
    );
  }
}
