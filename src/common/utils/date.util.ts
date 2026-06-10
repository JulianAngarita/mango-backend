/**
 * Colección de utilidades de fecha usadas en todo el proyecto.
 *
 * Convención: todas las fechas se almacenan en UTC en Supabase
 * y se convierten a la zona horaria del gym/usuario solo al mostrar.
 */

/** Devuelve la fecha actual como string YYYY-MM-DD en UTC. */
export function todayUTC(): string {
    return new Date().toISOString().split('T')[0];
}

/** Devuelve la fecha de hace N días como string YYYY-MM-DD. */
export function daysAgo(days: number): string {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - days);
    return date.toISOString().split('T')[0];
}

/** Devuelve la fecha de dentro de N días como string YYYY-MM-DD. */
export function daysFromNow(days: number): string {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().split('T')[0];
}

/** Devuelve el inicio del día actual en UTC como ISO string. */
export function startOfDayUTC(date: Date = new Date()): string {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    return d.toISOString();
}

/** Devuelve el fin del día actual en UTC como ISO string. */
export function endOfDayUTC(date: Date = new Date()): string {
    const d = new Date(date);
    d.setUTCHours(23, 59, 59, 999);
    return d.toISOString();
}

/** Devuelve el primer día del mes actual en UTC. */
export function startOfMonthUTC(date: Date = new Date()): string {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
        .toISOString()
        .split('T')[0];
}

/** Devuelve el último día del mes actual en UTC. */
export function endOfMonthUTC(date: Date = new Date()): string {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0))
        .toISOString()
        .split('T')[0];
}

/**
 * Calcula la diferencia en días entre dos fechas.
 * Útil para calcular rachas, vencimientos y días de membresía restantes.
 */
export function diffInDays(from: Date | string, to: Date | string): number {
    const a = new Date(from).getTime();
    const b = new Date(to).getTime();
    return Math.floor((b - a) / (1000 * 60 * 60 * 24));
}

/**
 * Devuelve true si una fecha ISO está en el pasado.
 * Usado para verificar membresías vencidas.
 */
export function isExpired(date: string): boolean {
    return new Date(date) < new Date();
}

/**
 * Devuelve true si una fecha ISO vence en los próximos N días.
 * Usado para alertas de renovación de membresía.
 */
export function expiresWithinDays(date: string, days: number): boolean {
    const expiry = new Date(date);
    const limit = new Date();
    limit.setUTCDate(limit.getUTCDate() + days);
    return expiry > new Date() && expiry <= limit;
}

/**
 * Formatea una fecha como string legible.
 * Se usa para mensajes de email, WhatsApp y SMS.
 * Ejemplo: '15 de enero de 2025'
 */
export function formatDateSpanish(
    date: Date | string,
    locale = 'es-CO',
): string {
    return new Date(date).toLocaleDateString(locale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}