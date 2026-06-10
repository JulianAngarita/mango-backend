import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

/**
 * CacheService — abstracción sobre cache-manager con Upstash Redis.
 *
 * Centraliza las operaciones de caché con prefijos por dominio
 * para evitar colisiones entre módulos.
 *
 * Prefijos de claves:
 *   profile:{userId}          → datos de perfil del usuario
 *   gym:{gymId}               → datos del gimnasio
 *   leaderboard:{gymId}       → ranking de retos del gym
 *   rate:{userId}:{action}    → contador de rate limiting
 *   session:{token}           → sesiones temporales (QR, OTP)
 */
@Injectable()
export class CacheService {
    constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) { }

    // ── Operaciones base ────────────────────────────────────────────────────

    async get<T>(key: string): Promise<T | null> {
        return (await this.cache.get<T>(key)) ?? null;
    }

    async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
        await this.cache.set(key, value, ttlSeconds ? ttlSeconds * 1000 : undefined);
    }

    async del(key: string): Promise<void> {
        await this.cache.del(key);
    }

    // ── Caché de perfiles ───────────────────────────────────────────────────

    profileKey(userId: string): string {
        return `profile:${userId}`;
    }

    async getProfile<T>(userId: string): Promise<T | null> {
        return this.get<T>(this.profileKey(userId));
    }

    async setProfile(userId: string, profile: unknown, ttl = 300): Promise<void> {
        await this.set(this.profileKey(userId), profile, ttl);
    }

    async invalidateProfile(userId: string): Promise<void> {
        await this.del(this.profileKey(userId));
    }

    // ── Caché de gimnasios ──────────────────────────────────────────────────

    gymKey(gymId: string): string {
        return `gym:${gymId}`;
    }

    async getGym<T>(gymId: string): Promise<T | null> {
        return this.get<T>(this.gymKey(gymId));
    }

    async setGym(gymId: string, gym: unknown, ttl = 600): Promise<void> {
        await this.set(this.gymKey(gymId), gym, ttl);
    }

    async invalidateGym(gymId: string): Promise<void> {
        await this.del(this.gymKey(gymId));
    }

    // ── Rate limiting ───────────────────────────────────────────────────────

    /**
     * Incrementa un contador de rate limiting y devuelve el valor actual.
     * Si la clave no existe, la crea con TTL.
     * Los controllers usan esto para límites personalizados por acción.
     */
    async incrementRateLimit(
        userId: string,
        action: string,
        ttlSeconds = 60,
    ): Promise<number> {
        const key = `rate:${userId}:${action}`;
        const current = await this.get<number>(key) ?? 0;
        const next = current + 1;
        await this.set(key, next, current === 0 ? ttlSeconds : undefined);
        return next;
    }

    // ── Sesiones temporales ─────────────────────────────────────────────────

    async setSession(token: string, data: unknown, ttlSeconds = 300): Promise<void> {
        await this.set(`session:${token}`, data, ttlSeconds);
    }

    async getSession<T>(token: string): Promise<T | null> {
        return this.get<T>(`session:${token}`);
    }

    async deleteSession(token: string): Promise<void> {
        await this.del(`session:${token}`);
    }
}