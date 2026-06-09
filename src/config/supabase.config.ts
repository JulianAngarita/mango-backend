
import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';
 
export const supabaseConfigSchema = Joi.object({
  SUPABASE_URL: Joi.string().uri().required(),
 
  // Clave anon: puede usarse en el cliente con RLS activo
  SUPABASE_ANON_KEY: Joi.string().required(),
 
  // Clave service_role: ignora RLS, solo en backend, nunca en el cliente
  SUPABASE_SERVICE_ROLE_KEY: Joi.string().required(),
});
 
export const supabaseConfig = registerAs('supabase', () => ({
  url: process.env.SUPABASE_URL ?? '',
  anonKey: process.env.SUPABASE_ANON_KEY ?? '',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
}));
 