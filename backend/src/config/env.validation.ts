import { z } from 'zod';

export const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // AI — станет обязательным в Phase 2
  AI_API_KEY: z.string().optional(),

  // Auth (JWT)
  JWT_ACCESS_SECRET: z
    .string()
    .min(16, 'JWT_ACCESS_SECRET must be at least 16 chars'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(16, 'JWT_REFRESH_SECRET must be at least 16 chars'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),

  // Email — primary path is Gmail SMTP via nodemailer (delivers to any address).
  // Resend remains as fallback only (kept for future domain-verified production).
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM_EMAIL: z.string().email().optional(),
  SMTP_FROM_NAME: z.string().default('Happy Calendar'),

  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z
    .string()
    .email()
    .default('onboarding@resend.dev'),

  // Firebase
  FIREBASE_PROJECT_ID: z.string().min(1, 'FIREBASE_PROJECT_ID is required'),
  FIREBASE_CLIENT_EMAIL: z
    .string()
    .email('FIREBASE_CLIENT_EMAIL must be a valid email'),
  FIREBASE_PRIVATE_KEY: z.string().min(1, 'FIREBASE_PRIVATE_KEY is required'),
});

export type Env = z.infer<typeof envSchema>;

export function validate(config: Record<string, unknown>) {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    console.error('❌ Invalid environment configuration:');
    console.error(result.error.format());
    throw new Error('Invalid environment configuration');
  }

  return result.data;
}
