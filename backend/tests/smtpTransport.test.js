import { describe, it, expect } from 'vitest';
import { classifySmtpError, isSenderAllowed } from '../src/providers/smtpTransportFactory.js';

describe('SMTP Error Classifier', () => {
  it('should identify authentication failures as permanent auth errors', () => {
    const authError = new Error('Invalid credentials');
    authError.responseCode = 535;

    const result = classifySmtpError(authError);
    expect(result.isPermanent).toBe(true);
    expect(result.isAuthFailure).toBe(true);
  });

  it('should identify 5xx errors (e.g. 550 Mailbox not found) as permanent non-retryable errors', () => {
    const error550 = new Error('550 5.1.1 User unknown');
    error550.responseCode = 550;

    const result = classifySmtpError(error550);
    expect(result.isPermanent).toBe(true);
    expect(result.isAuthFailure).toBe(false);
  });

  it('should identify connection timeouts and 4xx errors as transient retryable errors', () => {
    const timeoutError = new Error('Connection timed out');
    timeoutError.code = 'ETIMEDOUT';

    const result = classifySmtpError(timeoutError);
    expect(result.isPermanent).toBe(false);
    expect(result.isAuthFailure).toBe(false);

    const error421 = new Error('421 Service not available');
    error421.responseCode = 421;
    const result421 = classifySmtpError(error421);
    expect(result421.isPermanent).toBe(false);
  });
});

describe('Sender Authorization Logic', () => {
  // Test import of isSenderAllowed from accountSelector
  it('should verify exact and wildcard sender matching', async () => {
    const { isSenderAllowed } = await import('../src/services/accountSelector.js');

    // Empty list allows all
    expect(isSenderAllowed('any@domain.com', [])).toBe(true);

    // Exact match
    const allowed = ['support@vexillar.com', '*@tars.co'];
    expect(isSenderAllowed('support@vexillar.com', allowed)).toBe(true);
    expect(isSenderAllowed('billing@vexillar.com', allowed)).toBe(false);

    // Wildcard match
    expect(isSenderAllowed('sales@tars.co', allowed)).toBe(true);
    expect(isSenderAllowed('info@tars.co', allowed)).toBe(true);
    expect(isSenderAllowed('info@other.co', allowed)).toBe(false);
  });
});
