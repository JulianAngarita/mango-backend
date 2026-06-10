/**
 * Estados de membresía de un miembro en un gimnasio.
 * Debe coincidir con el enum membership_status de PostgreSQL.
 */
export enum MembershipStatusEnum {
    ACTIVE = 'active',
    EXPIRED = 'expired',
    CANCELLED = 'cancelled',
    PAUSED = 'paused',
}

/**
 * Estados de un miembro del gimnasio.
 * Debe coincidir con el enum member_status de PostgreSQL.
 */
export enum MemberStatusEnum {
    ACTIVE = 'active',
    PAUSED = 'paused',
    CANCELLED = 'cancelled',
    PROSPECT = 'prospect',
}

/**
 * Estados de una transacción de pago.
 * Debe coincidir con el enum payment_status de PostgreSQL.
 */
export enum PaymentStatusEnum {
    PENDING = 'pending',
    PAID = 'paid',
    FAILED = 'failed',
    REFUNDED = 'refunded',
}

/**
 * Etapas del pipeline de ventas para prospectos.
 * Debe coincidir con el enum prospect_stage de PostgreSQL.
 */
export enum ProspectStageEnum {
    NEW = 'new',
    CONTACTED = 'contacted',
    INTERESTED = 'interested',
    FREE_TRIAL = 'free_trial',
    NEGOTIATION = 'negotiation',
    WON = 'won',
    LOST = 'lost',
}

/**
 * Fuentes de origen de un prospecto.
 * Debe coincidir con el enum prospect_source de PostgreSQL.
 */
export enum ProspectSourceEnum {
    FACEBOOK_ADS = 'facebook_ads',
    INSTAGRAM = 'instagram',
    TIKTOK = 'tiktok',
    REFERRAL = 'referral',
    WEBSITE = 'website',
    WHATSAPP = 'whatsapp',
    WALK_IN = 'walk_in',
    OTHER = 'other',
}

/**
 * Métodos de control de acceso / check-in.
 * Debe coincidir con el enum attendance_method de PostgreSQL.
 */
export enum AttendanceMethodEnum {
    QR = 'qr',
    MANUAL = 'manual',
    BIOMETRIC = 'biometric',
}

/**
 * Tipos de entrenamiento para workouts.
 * Debe coincidir con el enum workout_type de PostgreSQL.
 */
export enum WorkoutTypeEnum {
    STRENGTH = 'strength',
    CARDIO = 'cardio',
    HIIT = 'hiit',
    YOGA = 'yoga',
    PILATES = 'pilates',
    CROSSFIT = 'crossfit',
    OTHER = 'other',
}

/**
 * Fuente de origen de un workout registrado.
 * Debe coincidir con el enum workout_source de PostgreSQL.
 */
export enum WorkoutSourceEnum {
    MANUAL = 'manual',
    APPLE_HEALTH = 'apple_health',
    GOOGLE_FIT = 'google_fit',
    GARMIN = 'garmin',
}

/**
 * Proveedores de pago disponibles.
 * Debe coincidir con el enum payment_provider de PostgreSQL.
 */
export enum PaymentProviderEnum {
    STRIPE = 'stripe',
    MERCADOPAGO = 'mercadopago',
    CASH = 'cash',
    TRANSFER = 'transfer',
    DATAPHONE = 'dataphone',
}