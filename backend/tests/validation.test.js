import { describe, it, expect } from 'vitest';
import { SendEmailSchema, SmtpAccountSchema, ProjectCreateSchema } from '../src/validators/emailValidator.js';

describe('Validation Schemas (Zod)', () => {
  it('should validate a valid send email payload', () => {
    const valid = {
      from: { name: 'Support', address: 'support@example.com' },
      to: ['client@example.com'],
      subject: 'Hello World',
      html: '<h1>Hi there!</h1>'
    };

    const parsed = SendEmailSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });

  it('should validate send email payload with dynamic on-the-fly SMTP credentials', () => {
    const valid = {
      smtp: {
        host: 'smtp.hostinger.com',
        port: 465,
        secure: true,
        auth: {
          user: 'hello@clientdomain.com',
          pass: 'SecretPassword123'
        }
      },
      to: ['client@example.com'],
      subject: 'Dynamic Relay Test',
      html: '<p>Testing dynamic SMTP relay</p>'
    };

    const parsed = SendEmailSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
    expect(parsed.data.smtp.host).toBe('smtp.hostinger.com');
  });

  it('should accept rawMime RFC 822 mode', () => {
    const valid = {
      to: 'client@example.com',
      subject: 'Raw Email',
      rawMime: 'MIME-Version: 1.0\r\nContent-Type: text/plain\r\n\r\nHello raw MIME'
    };

    const parsed = SendEmailSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });

  it('should reject email if both html, text and rawMime are omitted', () => {
    const invalid = {
      to: ['client@example.com'],
      subject: 'No Content Email'
    };

    const parsed = SendEmailSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('should reject invalid recipient email format', () => {
    const invalid = {
      to: ['not-an-email'],
      subject: 'Test',
      text: 'Hello'
    };

    const parsed = SendEmailSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('should validate project creation fields', () => {
    const valid = {
      name: 'Vexillar Production',
      dailyLimit: 2000,
      monthlyLimit: 50000,
      rateLimitPerMinute: 100
    };

    const parsed = ProjectCreateSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });
});
