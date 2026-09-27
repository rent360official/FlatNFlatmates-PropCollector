import dns from 'dns';
import { promisify } from 'util';

const dnsLookup = promisify(dns.lookup);

function isPrivateIp(ip: string): boolean {
  // IPv4 check
  const ipv4Parts = ip.split('.').map(Number);
  if (ipv4Parts.length === 4 && ipv4Parts.every((p) => !isNaN(p) && p >= 0 && p <= 255)) {
    const [a, b] = ipv4Parts;
    // 0.0.0.0/8
    if (a === 0) return true;
    // 10.0.0.0/8
    if (a === 10) return true;
    // 100.64.0.0/10
    if (a === 100 && b >= 64 && b <= 127) return true;
    // 127.0.0.0/8
    if (a === 127) return true;
    // 169.254.0.0/16 (Link local / AWS metadata)
    if (a === 169 && b === 254) return true;
    // 172.16.0.0/12
    if (a === 172 && b >= 16 && b <= 31) return true;
    // 192.0.0.0/24 & 192.0.2.0/24
    if (a === 192 && b === 0) return true;
    // 192.168.0.0/16
    if (a === 192 && b === 168) return true;
    // 198.18.0.0/15
    if (a === 198 && (b === 18 || b === 19)) return true;
    // 198.51.100.0/24
    if (a === 198 && b === 51) return true;
    // 203.0.113.0/24
    if (a === 203 && b === 0) return true;
    // 224.0.0.0/4 (Multicast) & 240.0.0.0/4 (Reserved)
    if (a >= 224) return true;
    return false;
  }

  // IPv6 check
  const lower = ip.toLowerCase();
  if (
    lower === '::1' ||
    lower === '::' ||
    lower.startsWith('fe80:') ||
    lower.startsWith('fc') ||
    lower.startsWith('fd') ||
    lower.includes('::ffff:127.') ||
    lower.includes('::ffff:10.') ||
    lower.includes('::ffff:192.168.') ||
    lower.includes('::ffff:172.')
  ) {
    return true;
  }

  return false;
}

export interface UrlValidationResult {
  isValid: boolean;
  sanitizedUrl?: string;
  error?: string;
}

export async function validateScrapeUrl(rawUrl: string): Promise<UrlValidationResult> {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { isValid: false, error: 'Please enter a valid property listing URL.' };
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return { isValid: false, error: 'Invalid URL format. Please include http:// or https://.' };
  }

  // Restrict protocol
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { isValid: false, error: 'Only HTTP and HTTPS URLs are supported.' };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block obvious internal hosts
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname === '169.254.169.254' ||
    hostname === 'metadata.google.internal' ||
    hostname === 'instance-data'
  ) {
    return { isValid: false, error: 'Access to local or internal network URLs is blocked.' };
  }

  // Check if hostname is direct IP address
  if (isPrivateIp(hostname)) {
    return { isValid: false, error: 'Access to private or local IP addresses is blocked.' };
  }

  // DNS lookup to verify resolved IP is not private
  try {
    const lookupResult = await dnsLookup(hostname);
    if (isPrivateIp(lookupResult.address)) {
      return { isValid: false, error: 'The specified URL resolves to an internal or private address.' };
    }
  } catch (err: any) {
    return { isValid: false, error: `Could not resolve domain '${hostname}'. Please check the URL.` };
  }

  return { isValid: true, sanitizedUrl: parsed.toString() };
}
