import { z } from 'zod';
import { env } from '../config/env.js';

const emailAddressRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EmailContactSchema = z.union([
  z.string().regex(emailAddressRegex, 'Invalid email address format'),
  z.object({
    name: z.string().optional(),
    address: z.string().regex(emailAddressRegex, 'Invalid email address in address property')
  })
]);

const RecipientListSchema = z.union([
  z.string().regex(emailAddressRegex).transform(val => [val]),
  z.array(z.string().regex(emailAddressRegex, 'Invalid recipient email format')).min(1, 'At least one recipient is required')
]);

const OptionalRecipientListSchema = z.union([
  z.string().regex(emailAddressRegex).transform(val => [val]),
  z.array(z.string().regex(emailAddressRegex, 'Invalid recipient email format'))
]).optional().default([]);

const AttachmentSchema = z.object({
  filename: z.string().min(1, 'Attachment filename is required'),
  content: z.string().optional(), // base64 string
  encoding: z.string().optional().default('base64'),
  path: z.string().optional(), // Remote URL (SSRF verified)
  contentType: z.string().optional(),
  cid: z.string().optional() // Inline image content-id
}).refine(data => data.content || data.path, {
  message: 'Attachment must have either content (base64) or a path (safe URL)'
});

// Dynamic On-The-Fly SMTP Configuration Schema
export const DynamicSmtpSchema = z.object({
  host: z.string().min(1, 'SMTP host is required'),
  port: z.union([z.number(), z.string().transform(Number)]).default(587),
  secure: z.boolean().optional(),
  securityMode: z.enum(['SSL/TLS', 'STARTTLS']).optional(),
  auth: z.object({
    user: z.string().min(1, 'SMTP username/email is required'),
    pass: z.string().min(1, 'SMTP password is required')
  }),
  tls: z.object({
    rejectUnauthorized: z.boolean().optional()
  }).optional()
});

export const SendEmailSchema = z.object({
  // Dynamic SMTP Credentials sent directly in request body (optional - overrides preconfigured DB account)
  smtp: DynamicSmtpSchema.optional(),

  from: EmailContactSchema.optional(),
  to: RecipientListSchema,
  cc: OptionalRecipientListSchema,
  bcc: OptionalRecipientListSchema,
  subject: z.string().min(1, 'Subject cannot be empty'),
  html: z.string().optional(),
  text: z.string().optional(),
  rawMime: z.string().optional(), // Raw MIME RFC 822 mode
  attachments: z.array(AttachmentSchema).optional().default([]),
  replyTo: EmailContactSchema.optional(),
  headers: z.record(z.string()).optional(),
  metadata: z.record(z.any()).optional().default({}),
  smtpAccountId: z.string().optional()
}).refine(data => data.html || data.text || data.rawMime, {
  message: 'Email must include at least html, text, or rawMime content'
});

export const BulkEmailSchema = z.object({
  smtp: DynamicSmtpSchema.optional(),
  emails: z.array(SendEmailSchema).min(1).max(50, 'Maximum 50 emails can be queued in one bulk request')
});

export const ProjectCreateSchema = z.object({
  name: z.string().min(2).max(50).trim(),
  description: z.string().max(200).optional().default(''),
  dailyLimit: z.number().int().positive().optional().default(1000),
  monthlyLimit: z.number().int().positive().optional().default(30000),
  rateLimitPerMinute: z.number().int().positive().optional().default(60),
  allowedSmtpAccounts: z.array(z.string()).optional().default([]),
  allowedSenders: z.array(z.string()).optional().default([])
});

export const ProjectUpdateSchema = z.object({
  name: z.string().min(2).max(50).trim().optional(),
  description: z.string().max(200).optional(),
  isActive: z.boolean().optional(),
  dailyLimit: z.number().int().positive().optional(),
  monthlyLimit: z.number().int().positive().optional(),
  rateLimitPerMinute: z.number().int().positive().optional(),
  allowedSmtpAccounts: z.array(z.string()).optional(),
  allowedSenders: z.array(z.string()).optional()
});

export const SmtpAccountSchema = z.object({
  name: z.string().min(2).max(50).trim(),
  providerType: z.enum(['hostinger', 'google', 'custom']).default('custom'),
  host: z.string().min(1),
  port: z.number().int().min(1).max(65535),
  username: z.string().min(1),
  password: z.string().min(1).optional(), // Optional on update, required on create
  securityMode: z.enum(['SSL/TLS', 'STARTTLS']),
  fromEmail: z.string().regex(emailAddressRegex),
  fromName: z.string().optional().default('Veyron Gateway'),
  dailyLimit: z.number().int().positive().optional().default(500),
  monthlyLimit: z.number().int().positive().optional().default(15000),
  rateLimitPerMinute: z.number().int().positive().optional().default(30),
  connectionTimeout: z.number().int().positive().optional().default(10000),
  socketTimeout: z.number().int().positive().optional().default(15000),
  assignedProjects: z.array(z.string()).optional().default([])
});
