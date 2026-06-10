/**
 * Planes de suscripción B2C para usuarios finales.
 * Debe coincidir con el enum user_plan de PostgreSQL.
 */
export enum UserPlanEnum {
    FREE = 'free',
    PREMIUM = 'premium',
}

/**
 * Planes de suscripción B2B para gimnasios.
 * Debe coincidir con el enum gym_plan de PostgreSQL.
 */
export enum GymPlanEnum {
    STARTER = 'starter',
    GROWTH = 'growth',
    PRO = 'pro',
    ENTERPRISE = 'enterprise',
}

/**
 * Ciclos de facturación de membresías de gimnasio.
 * Debe coincidir con el enum billing_cycle de PostgreSQL.
 */
export enum BillingCycleEnum {
    DAILY = 'daily',
    WEEKLY = 'weekly',
    MONTHLY = 'monthly',
    QUARTERLY = 'quarterly',
    BIANNUAL = 'biannual',
    YEARLY = 'yearly',
}