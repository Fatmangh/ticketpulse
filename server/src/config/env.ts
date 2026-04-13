import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  CLOVER_SANDBOX: z.coerce.boolean().default(true),
  CLOVER_MERCHANT_ID: z.string().optional(),
  CLOVER_API_TOKEN: z.string().optional(),
  CLOVER_BASE_URL: z.string().default('https://sandbox.dev.clover.com'),
  SENDGRID_API_KEY: z.string().optional(),
  SENDGRID_FROM_EMAIL: z.string().default('tickets@ticketpulse.app'),
  SENDGRID_FROM_NAME: z.string().default('TicketPulse'),
});

function loadEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment variables:', result.error.flatten().fieldErrors);
    process.exit(1);
  }
  return result.data;
}

export const env = loadEnv();
export type Env = z.infer<typeof envSchema>;
