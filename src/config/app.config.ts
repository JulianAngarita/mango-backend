
import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';
 
export const appConfigSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'staging', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  CORS_ORIGINS: Joi.string().default('http://localhost:3000'),
  API_VERSION: Joi.string().default('1'),
});
 
export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV     ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  corsOrigins: process.env.CORS_ORIGINS ?? 'http://localhost:3000',
  apiVersion: process.env.API_VERSION  ?? '1',
  isDev: (process.env.NODE_ENV ?? 'development') === 'development',
  isProd: process.env.NODE_ENV === 'production',
}));
 