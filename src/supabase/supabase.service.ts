import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './supabase.types';

/**
 * SupabaseService — cliente con service_role key.
 *
 * Ignora completamente Row-Level Security (RLS).
 * Usar SOLO en operaciones del backend que requieran acceso total:
 *   - Webhooks de pagos (no hay usuario autenticado)
 *   - Edge functions y jobs de BullMQ
 *   - Operaciones de super_admin
 *   - Lectura de datos de IA (FastAPI los lee con supabase-py)
 *
 * NUNCA exponer esta clave al cliente (mobile/web).
 */
@Injectable()
export class SupabaseService {
  private readonly client: SupabaseClient<Database>;

  constructor(private readonly config: ConfigService) {
    this.client = createClient<Database>(
      this.config.get<string>('supabase.url')!,
      this.config.get<string>('supabase.serviceRoleKey')!,
      {
        auth: {
          // Con service_role no necesitamos persistir sesión
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      },
    );
  }

  getClient(): SupabaseClient<Database> {
    return this.client;
  }
}