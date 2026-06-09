import { Module, Global } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { SupabaseAnonService } from './supabase-anon.service';

/**
 * SupabaseModule — módulo global.
 *
 * Al marcarlo como @Global(), tanto SupabaseService como SupabaseAnonService
 * están disponibles para inyectar en cualquier módulo sin necesidad
 * de importar SupabaseModule explícitamente en cada uno.
 *
 * Los repositorios de cada módulo inyectan el servicio que necesitan:
 *   - SupabaseService     → operaciones admin (webhooks, jobs, super_admin)
 *   - SupabaseAnonService → operaciones user-scoped (respetan RLS)
 */
@Global()
@Module({
  providers: [SupabaseService, SupabaseAnonService],
  exports: [SupabaseService, SupabaseAnonService],
})
export class SupabaseModule {}