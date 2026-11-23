import dns from 'dns/promises';
import { URL } from 'url';

const BLOCKED_HOSTNAMES = new Set(['localhost', 'metadata.google.internal']);

function isPrivateIp(ip) {
  // IPv4 checks
  const ipv4Match = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [, a, b] = ipv4Match.map(Number);
    if (a === 127) return true; // Loopback
    if (a === 10) return true; // Class A private
    if (a === 172 && b >= 16 && b <= 31) return true; // Class B private
    if (a === 192 && b === 168) return true; // Class C private
    if (a === 169 && b === 254) return true; // Link-local / Cloud metadata (e.g. 169.254.169.254)
    if (a === 0) return true; // Current network
    if (a >= 224) return true; // Multicast / Reserved
  }

  // IPv6 checks
  if (ip === '::1' || ip.startsWith('fe80:') || ip.startsWith('fc') || ip.startsWith('fd')) {
    return true;
  }

  return false;
}

/**
 * Validates a remote URL against SSRF attacks before downloading attachments
 * @param {string} inputUrl
 * @returns {Promise<boolean>}
 */
export async function validateSafeUrl(inputUrl) {
  try {
    const parsed = new URL(inputUrl);

    // Only allow HTTP/HTTPS
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error(`Forbidden protocol: ${parsed.protocol}`);
    }

    const hostname = parsed.hostname.toLowerCase();

    if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith('.local')) {
      throw new Error(`Forbidden hostname: ${hostname}`);
    }

    // Resolve hostname to IP to protect against DNS rebinding and internal network scanning
    const addresses = await dns.lookup(hostname, { all: true });

    for (const addr of addresses) {
      if (isPrivateIp(addr.address)) {
        throw new Error(`Host resolves to restricted private IP: ${addr.address}`);
      }
    }

    return true;
  } catch (err) {
    throw new Error(`SSRF Validation Failed: ${err.message}`);
  }
}
