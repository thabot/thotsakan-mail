import { z } from 'zod';

export const envSchema = z.object({
  PORT: z.coerce.number().default(9547),
  SMTP_PORT: z.coerce.number().default(9548),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DB_PATH: z.string().default('data/thotsakan.db'),
  ENCRYPTION_KEY: z
    .string()
    .length(64, 'ENCRYPTION_KEY must be a 32-byte hex string (64 characters)')
    .regex(/^[0-9a-fA-F]+$/, 'ENCRYPTION_KEY must contain only hexadecimal characters')
    .default('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'),
  LICENSE_KEY: z.string().optional(),
  THOTSAKAN_EMERGENCY_OVERRIDE: z
    .string()
    .optional()
    .transform((val) => val === 'true' || val === '1'),
  THOTSAKAN_EMERGENCY_REASON: z.string().optional(),
  DEAD_LETTER_WEBHOOK_URL: z.string().url().optional().or(z.literal('')),
  LOG_RETENTION_DAYS: z.coerce.number().default(90),
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;

export function getEnv(): Env {
  if (!_env) {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
      console.error('❌ Environment validation failed:', result.error.format());
      throw new Error('Invalid environment configuration');
    }
    _env = result.data;
  }
  return _env;
}

export function setEnvForTest(override: Partial<Env>): void {
  _env = envSchema.parse({
    ...(_env || envSchema.parse(process.env)),
    ...override,
  });
}
