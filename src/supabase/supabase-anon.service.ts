import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './supabase.types';

/**
 * SupabaseAnonService — cliente con anon key.
 *
 * Respeta Row-Level Security (RLS).
 * Usar cuando la query debe ejecutarse en el contexto del usuario autenticado,
 * es decir, cuando RLS debe filtrar los datos automáticamente:
 *   - Queries de hábitos, tracking, feed, progreso → solo los del propio usuario
 *   - Queries del CRM → solo los del gym del admin autenticado
 *
 * El método forUser() recibe el JWT del usuario (extraído por el guard)
 * y devuelve un cliente ya autenticado con ese token.
 */
@Injectable()
export class SupabaseAnonService {
  private readonly baseClient: SupabaseClient<Database>;

  constructor(private readonly config: ConfigService) {
    this.baseClient = createClient<Database>(
      this.config.get<string>('supabase.url')!,
      this.config.get<string>('supabase.anonKey')!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      },
    );
  }

  /**
   * Devuelve un cliente de Supabase autenticado con el JWT del usuario.
   * Las queries ejecutadas con este cliente respetan RLS.
   *
   * Uso en repositorios:
   *   const client = this.supabaseAnon.forUser(userToken);
   *   const { data } = await client.from('habits').select('*');
   *   // Solo devuelve los hábitos del usuario del token — RLS lo garantiza
   */
  forUser(accessToken: string): SupabaseClient<Database> {
    return createClient<Database>(
      this.config.get<string>('supabase.url')!,
      this.config.get<string>('supabase.anonKey')!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      },
    );
  }

  /**
   * Cliente base sin autenticación.
   * Solo para queries sobre tablas con datos públicos (ej. catálogo de badges).
   */
  getBaseClient(): SupabaseClient<Database> {
    return this.baseClient;
  }
}