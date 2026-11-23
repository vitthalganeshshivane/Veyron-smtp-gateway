import pino from 'pino';
import { env } from '../config/env.js';

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      'password',
      'pass',
      '*.password',
      '*.pass',
      'smtp.auth.pass',
      '*.smtp.auth.pass',
      'x-smtp-pass',
      'headers.x-smtp-pass',
      '*.x-smtp-pass',
      'apiKey',
      '*.apiKey',
      'secret',
      '*.secret',
      'authorization',
      'headers.authorization',
      'token',
      '*.token'
    ],
    censor: '[REDACTED]'
  },
  transport: env.NODE_ENV !== 'production' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  } : undefined,
  base: {
    env: env.NODE_ENV
  }
});
