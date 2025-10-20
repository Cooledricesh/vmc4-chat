import { z } from 'zod';
import type { AppConfig } from '@/backend/hono/context';

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  JWT_SECRET: z.string().min(1),
});

let cachedConfig: AppConfig | null = null;

export const getAppConfig = (): AppConfig => {
  if (cachedConfig) {
    return cachedConfig;
  }

  // 환경 변수 값 확인을 위한 로깅 (민감한 정보는 마스킹)
  const envValues = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    JWT_SECRET: process.env.JWT_SECRET,
  };

  console.log('[Config] Environment variables check:', {
    SUPABASE_URL: envValues.SUPABASE_URL ? `${envValues.SUPABASE_URL.substring(0, 20)}...` : 'MISSING',
    SUPABASE_SERVICE_ROLE_KEY: envValues.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING',
    JWT_SECRET: envValues.JWT_SECRET ? 'SET' : 'MISSING',
  });

  const parsed = envSchema.safeParse(envValues);

  if (!parsed.success) {
    const messages = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || 'config'}: ${issue.message}`)
      .join('; ');
    console.error('[Config] Validation failed:', messages);
    throw new Error(`Invalid backend configuration: ${messages}`);
  }

  console.log('[Config] Configuration validated successfully');

  cachedConfig = {
    supabase: {
      url: parsed.data.SUPABASE_URL,
      serviceRoleKey: parsed.data.SUPABASE_SERVICE_ROLE_KEY,
    },
    jwtSecret: parsed.data.JWT_SECRET,
  } satisfies AppConfig;

  return cachedConfig;
};
