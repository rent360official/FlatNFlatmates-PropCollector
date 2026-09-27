import * as cheerio from 'cheerio';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const TIMEOUT_MS = 18000;
const MAX_CONTENT_LENGTH = 60000;

export interface ExtractedPageResult {
  text: string;
  method: 'HTTP' | 'HEADLESS_BROWSER';
  title?: string;
  metaDescription?: string;
}

/**
 * Clean HTML using Cheerio by stripping scripts, styles, ads, navigation, footers, and recommended listing blocks.
 */
export function cleanHtmlAndExtractText(html: string): {
  text: string;
  title: string;
  metaDescription: string;
  jsonLdData: string[];
} {
  const $ = cheerio.load(html);

  // Extract meta tags before removal
  const title = $('title').text().trim() || $('meta[property="og:title"]').attr('content') || '';
  const metaDescription =
    $('meta[name="description"]').attr('content') ||
    $('meta[property="og:description"]').attr('content') ||
    '';

  // Extract JSON-LD structured metadata (crucial for real-estate sites like SquareYards, NoBroker, Magicbricks)
  const jsonLdData: string[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const rawContent = $(el).html();
    if (rawContent && rawContent.trim()) {
      try {
        jsonLdData.push(rawContent.trim());
      } catch {
        // Ignore invalid jsonld
      }
    }
  });

  // Remove non-content / styling tags
  $('script, style, noscript, iframe, svg, canvas, audio, video, link, form, input, button, select, dialog').remove();
  $('nav, header, footer, aside').remove();

  // Remove noisy ad & recommendation sections
  const noisySelectors = [
    '[class*="similar"]',
    '[class*="recommended"]',
    '[class*="suggested"]',
    '[class*="related"]',
    '[class*="you-may-also-like"]',
    '[class*="you-may-like"]',
    '[class*="popular-searches"]',
    '[class*="nearby-projects"]',
    '[class*="advertisement"]',
    '[class*="ad-banner"]',
    '[class*="ad_banner"]',
    '[class*="adsbygoogle"]',
    '[class*="sponsor"]',
    '[class*="cookie"]',
    '[class*="gdpr"]',
    '[class*="modal"]',
    '[class*="popup"]',
    '[class*="newsletter"]',
    '[id*="similar"]',
    '[id*="recommended"]',
    '[id*="suggested"]',
    '[id*="related"]',
    '[id*="advertisement"]',
    '[id*="ad-banner"]',
  ];

  for (const selector of noisySelectors) {
    try {
      $(selector).remove();
    } catch {
      // Ignore invalid selector syntax
    }
  }

  // Extract main body text
  let extracted = $('body')
    .text()
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();

  // If text is excessively large, truncate
  if (extracted.length > MAX_CONTENT_LENGTH) {
    extracted = extracted.substring(0, MAX_CONTENT_LENGTH) + '\n\n[Content truncated for analysis]';
  }

  return { text: extracted, title, metaDescription, jsonLdData };
}

/**
 * Perform a static HTTP GET request with timeout and headers.
 */
async function fetchHttp(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (response.status === 403 || response.status === 401) {
      throw new Error(`The website blocked access (HTTP ${response.status}). Attempting browser-based render...`);
    }

    if (response.status === 404) {
      throw new Error('Property page not found (HTTP 404). Please verify the listing URL.');
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch page (HTTP ${response.status} ${response.statusText}).`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('text/plain') && !contentType.includes('application/xhtml')) {
      throw new Error('The URL does not point to a valid web page (HTML).');
    }

    return await response.text();
  } catch (err: any) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out after ${TIMEOUT_MS / 1000}s while loading the property URL.`);
    }
    throw err;
  }
}

/**
 * Headless browser fallback using Playwright for heavy client-rendered (SPA/React/Vue/Angular) pages.
 */
async function fetchWithPlaywright(url: string): Promise<string> {
  let chromium: any;
  try {
    const playwright = await import('playwright');
    chromium = playwright.chromium;
  } catch (e: any) {
    throw new Error('Playwright is not available for headless rendering.');
  }

  let browser: any = null;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });

    const context = await browser.newContext({
      userAgent: USER_AGENT,
      viewport: { width: 1280, height: 800 },
      locale: 'en-US',
    });

    const page = await context.newPage();

    // Block non-essential media to speed up render
    await page.route('**/*.{png,jpg,jpeg,webp,gif,svg,woff,woff2,ttf,mp4,webm}', (route: any) => route.abort());

    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUT_MS,
    });

    // Short wait for client JS components to populate
    await page.waitForTimeout(2000);

    const content = await page.content();
    return content;
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch {
        // Ignore close error
      }
    }
  }
}

/**
 * Main scraper function: attempts HTTP fetch, cleans HTML, and falls back to Playwright if content is too sparse.
 */
export async function scrapePropertyPage(url: string): Promise<ExtractedPageResult> {
  let html = '';
  let usedMethod: 'HTTP' | 'HEADLESS_BROWSER' = 'HTTP';
  let httpError: Error | null = null;

  try {
    html = await fetchHttp(url);
  } catch (err: any) {
    httpError = err;
  }

  let cleaned = html ? cleanHtmlAndExtractText(html) : { text: '', title: '', metaDescription: '', jsonLdData: [] };

  // Detect if page has insufficient content (e.g. CSR SPA or bot-blocked static response)
  const isInsufficient =
    !html ||
    (cleaned.text.length < 250 && (!cleaned.jsonLdData || cleaned.jsonLdData.length === 0)) ||
    cleaned.text.toLowerCase().includes('javascript is required');

  if (isInsufficient) {
    try {
      console.log(`[SCRAPER] Content is short or JS-rendered, switching to Headless Browser for ${url}...`);
      const browserHtml = await fetchWithPlaywright(url);
      cleaned = cleanHtmlAndExtractText(browserHtml);
      usedMethod = 'HEADLESS_BROWSER';
    } catch (browserErr: any) {
      // If Playwright fails or is not supported, and we had an HTTP result or error
      if (cleaned.text.length >= 100 || (cleaned.jsonLdData && cleaned.jsonLdData.length > 0)) {
        // Keep partial static text
      } else if (httpError) {
        throw httpError;
      } else {
        throw new Error(
          browserErr.message ||
            'Could not extract sufficient property details from this page. The site may be protected or JavaScript-only.'
        );
      }
    }
  }

  if (cleaned.text.length < 50 && (!cleaned.jsonLdData || cleaned.jsonLdData.length === 0)) {
    throw new Error('The target page did not contain readable property listing information.');
  }

  // Combine title, meta, JSON-LD, and body text for richer context
  let combinedText = '';
  if (cleaned.title) combinedText += `PAGE TITLE: ${cleaned.title}\n`;
  if (cleaned.metaDescription) combinedText += `META DESCRIPTION: ${cleaned.metaDescription}\n\n`;

  if (cleaned.jsonLdData && cleaned.jsonLdData.length > 0) {
    combinedText += `STRUCTURED LISTING METADATA (JSON-LD):\n${cleaned.jsonLdData.join('\n')}\n\n`;
  }

  combinedText += `PAGE BODY CONTENT:\n${cleaned.text}`;

  console.log(`\n=================== [SCRAPER EXTRACTED DATA] ===================`);
  console.log(`URL: ${url}`);
  console.log(`Method: ${usedMethod}`);
  console.log(`Total Text Length: ${combinedText.length} characters`);
  console.log(`JSON-LD Blocks: ${cleaned.jsonLdData?.length || 0}`);
  console.log(`Preview (First 800 chars):\n${combinedText.substring(0, 800)}...`);
  console.log(`=================================================================\n`);

  return {
    text: combinedText,
    method: usedMethod,
    title: cleaned.title,
    metaDescription: cleaned.metaDescription,
  };
}
