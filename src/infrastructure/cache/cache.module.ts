import { Module, Global } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';

/**
 * CacheModule — wrapper global sobre @nestjs/cache-manager con Upstash Redis.
 *
 * Al ser @Global(), CacheService está disponible en todos los módulos
 * sin necesidad de importarlo explícitamente.
 *
 * Casos de uso:
 *   - Leaderboards de gamificación (Sorted Sets)
 *   - Rate limiting por usuario
 *   - Caché de perfiles y datos de gimnasio
 *   - Sesiones temporales (OTP, QR tokens)
 */
@Global()
@Module({
    imports: [
        NestCacheModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                store: 'ioredis',
                host: config.get<string>('redis.url'),
                ttl: config.get<number>('redis.ttl.cache'),
            }),
        }),
    ],
    providers: [CacheService],
    exports: [CacheService, NestCacheModule],
})
export class CacheModule { }