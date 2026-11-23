import { describe, it, expect, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env.js';
import { isSenderAllowed } from '../src/services/accountSelector.js';

describe('Admin Authentication & Token Handling', () => {
  it('should hash and compare admin password properly with bcrypt', async () => {
    const rawPassword = 'SecureAdminPassword2026!';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(rawPassword, salt);

    expect(await bcrypt.compare(rawPassword, hash)).toBe(true);
    expect(await bcrypt.compare('WrongPassword', hash)).toBe(false);
  });

  it('should sign and verify JWT tokens with roles', () => {
    const payload = { id: 'user_123', email: 'developer@client.com', role: 'user' };
    const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '1h' });

    const decoded = jwt.verify(token, env.JWT_SECRET);
    expect(decoded.id).toBe('user_123');
    expect(decoded.email).toBe('developer@client.com');
    expect(decoded.role).toBe('user');
  });

  it('should reject expired or forged tokens', () => {
    const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.fake_signature';
    expect(() => jwt.verify(fakeToken, env.JWT_SECRET)).toThrow();
  });
});

describe('Sender Authorization Rules', () => {
  it('should allow wildcard domain senders (*@company.com)', () => {
    const rules = ['*@vexillar.com', 'team@tars.ai'];

    expect(isSenderAllowed('alerts@vexillar.com', rules)).toBe(true);
    expect(isSenderAllowed('ceo@vexillar.com', rules)).toBe(true);
    expect(isSenderAllowed('team@tars.ai', rules)).toBe(true);
    expect(isSenderAllowed('other@tars.ai', rules)).toBe(false);
    expect(isSenderAllowed('hacker@evil.com', rules)).toBe(false);
  });
});
