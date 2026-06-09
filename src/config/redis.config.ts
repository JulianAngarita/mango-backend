import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

export const redisConfigSchema = Joi.object({
    UPSTASH_REDIS_URL: Joi.string().required(),

    // TTLs personalizables por entorno sin tocar el código
    REDIS_CACHE_TTL_SECONDS: Joi.number().default(300),   // caché general: 5 min
    REDIS_SESSION_TTL_SECONDS: Joi.number().default(3600), // sesiones: 1 hora
});

export const redisConfig = registerAs('redis', () => ({
    url: process.env.UPSTASH_REDIS_URL!,

    ttl: {
        cache: parseInt(process.env.REDIS_CACHE_TTL_SECONDS ?? '300', 10),
        session: parseInt(process.env.REDIS_SESSION_TTL_SECONDS ?? '3600', 10),
    },

    options: {
        tls: process.env.UPSTASH_REDIS_URL?.startsWith('rediss://') ? {} : undefined,
        maxRetriesPerRequest: 3,
        enableReadyCheck: false,
        lazyConnect: true,
    },
}));