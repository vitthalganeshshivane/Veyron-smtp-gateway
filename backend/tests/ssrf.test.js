import { describe, it, expect } from 'vitest';
import { validateSafeUrl } from '../src/utils/ssrfProtection.js';

describe('SSRF Protection Utility', () => {
  it('should block localhost and loopback IPs', async () => {
    await expect(validateSafeUrl('http://localhost/test.pdf')).rejects.toThrow();
    await expect(validateSafeUrl('http://127.0.0.1:8080/file.png')).rejects.toThrow();
  });

  it('should block private network IP addresses', async () => {
    await expect(validateSafeUrl('http://192.168.1.1/secret.txt')).rejects.toThrow();
    await expect(validateSafeUrl('http://10.0.0.5/invoice.pdf')).rejects.toThrow();
    await expect(validateSafeUrl('http://172.16.0.2/doc.pdf')).rejects.toThrow();
  });

  it('should block AWS / cloud metadata endpoints (169.254.169.254)', async () => {
    await expect(validateSafeUrl('http://169.254.169.254/latest/meta-data')).rejects.toThrow();
  });

  it('should reject non-HTTP/HTTPS protocols like file:// or gopher://', async () => {
    await expect(validateSafeUrl('file:///etc/passwd')).rejects.toThrow();
    await expect(validateSafeUrl('ftp://ftp.example.com/file')).rejects.toThrow();
  });
});
