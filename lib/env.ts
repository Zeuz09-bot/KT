/**
 * Keraunous Tech Store — Environment Variables Validation
 *
 * Validates server and public environment variables using Zod at startup.
 * Fails fast with descriptive error messages.
 */

import { z } from 'zod';

const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  HANDOFF_TOKEN_SECRET: z.string().min(16).optional(),
  CRON_SECRET: z.string().min(16).optional(),
  TURNSTILE_SECRET_KEY: z.string().min(1).optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  SENTRY_DSN: z.string().optional(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url()
    .default('http://localhost:3000'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1).optional(),
});

export type ServerEnv = z.infer<typeof serverSchema>;
export type ClientEnv = z.infer<typeof clientSchema>;

function validateEnv() {
  const isServer = typeof window === 'undefined';

  const clientResult = clientSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  });

  if (!clientResult.success) {
    console.error('❌ Invalid client environment variables:', clientResult.error.flatten().fieldErrors);
    throw new Error('Invalid client environment variables');
  }

  if (isServer) {
    const serverResult = serverSchema.safeParse({
      NODE_ENV: process.env.NODE_ENV,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      HANDOFF_TOKEN_SECRET: process.env.HANDOFF_TOKEN_SECRET,
      CRON_SECRET: process.env.CRON_SECRET,
      TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
      UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
      UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
      SENTRY_DSN: process.env.SENTRY_DSN,
    });

    if (!serverResult.success) {
      console.error('❌ Invalid server environment variables:', serverResult.error.flatten().fieldErrors);
      throw new Error('Invalid server environment variables');
    }

    return {
      server: serverResult.data,
      public: clientResult.data,
    };
  }

  return {
    server: {} as ServerEnv,
    public: clientResult.data,
  };
}

export const env = validateEnv();
