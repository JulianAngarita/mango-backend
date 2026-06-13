/**
 * supabase.types.ts
 *
 * Este archivo es generado automáticamente por el CLI de Supabase.
 * NO editar a mano.
 *
 * Para regenerar cuando cambies el esquema de la BD:
 *   npx supabase gen types typescript --project-id <tu-project-id> > src/supabase/supabase.types.ts
 *
 * O con la instancia local:
 *   npx supabase gen types typescript --local > src/supabase/supabase.types.ts
 *
 * Los tipos generados fluyen de la BD hacia los repositorios y servicios,
 * garantizando que el código TypeScript esté siempre sincronizado con el esquema real.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Tipos base de Supabase (copiados del helper de la librería)
// ─────────────────────────────────────────────────────────────────────────────
export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

// ─────────────────────────────────────────────────────────────────────────────
// Enums del esquema (deben coincidir con los ENUM de PostgreSQL)
// ─────────────────────────────────────────────────────────────────────────────
export type UserPlan = 'free' | 'premium';
export type UserRole = 'user' | 'gym_admin' | 'trainer' | 'super_admin';
export type GymPlan = 'starter' | 'growth' | 'pro' | 'enterprise';
export type MemberStatus = 'active' | 'paused' | 'cancelled' | 'prospect';
export type MembershipStatus = 'active' | 'expired' | 'cancelled' | 'paused';
export type BillingCycle = 'monthly' | 'quarterly' | 'yearly';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentProvider = 'stripe' | 'mercadopago' | 'cash';
export type ProspectSource = 'walk-in' | 'referral' | 'social' | 'web' | 'ad';
export type ProspectStage = 'new' | 'contacted' | 'visit' | 'negotiation' | 'won' | 'lost';
export type WorkoutType = 'strength' | 'cardio' | 'hiit' | 'yoga' | 'other';
export type WorkoutSource = 'manual' | 'apple_health' | 'google_fit' | 'garmin';
export type HabitFreqType = 'daily' | 'weekly';
export type ActivityType = 'workout' | 'habit' | 'goal' | 'progress';
export type AttendanceMethod = 'qr' | 'manual' | 'biometric';
export type BadgeCondition = 'streak' | 'total' | 'milestone';
export type NotifChannel = 'push' | 'email' | 'sms' | 'whatsapp';

// ─────────────────────────────────────────────────────────────────────────────
// Tipos de las tablas (se generan con supabase gen types)
// A continuación se incluye la estructura completa como placeholder tipado.
// Reemplazar con los tipos generados por el CLI cuando el esquema esté creado.
// ─────────────────────────────────────────────────────────────────────────────
export interface Database {
    public: {
        Tables: {

            // ── B2C ──────────────────────────────────────────────────────────────

            profiles: {
                Row: {
                    id: string;
                    email: string;
                    email_hash: string | null;     // SHA-256 del email para búsquedas seguras
                    full_name: string | null;      // cifrado AES-256-GCM
                    avatar_url: string | null;
                    bio: string | null;            // cifrado AES-256-GCM
                    phone: string | null;          // cifrado AES-256-GCM
                    address: string | null;        // cifrado AES-256-GCM
                    birth_date: string | null;     // cifrado AES-256-GCM
                    fcm_token: string | null;
                    plan: UserPlan;
                    role: UserRole;
                    xp_total: number;
                    level: number;
                    current_streak: number;
                    longest_streak: number;
                    onboarding_completed: boolean;
                    gym_id: string | null;
                    created_at: string;
                    updated_at: string;
                };
                // Insert explícito (no Omit) para que TypeScript conozca
                // exactamente qué campos acepta — evita el error 'never'
                Insert: {
                    id: string;
                    email: string;
                    email_hash?: string | null;
                    full_name?: string | null;
                    avatar_url?: string | null;
                    bio?: string | null;
                    phone?: string | null;
                    address?: string | null;
                    birth_date?: string | null;
                    fcm_token?: string | null;
                    plan?: UserPlan;
                    role?: UserRole;
                    gym_id?: string | null;
                };
                Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
            };

            habits: {
                Row: {
                    id: string;
                    user_id: string;
                    name: string;
                    icon: string | null;
                    frequency: Json;
                    target_value: number | null;
                    unit: string | null;
                    is_active: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['habits']['Row'],
                    'id' | 'is_active' | 'created_at' | 'updated_at'
                >;
                Update: Partial<Database['public']['Tables']['habits']['Insert']>;
            };

            habit_logs: {
                Row: {
                    id: string;
                    habit_id: string;
                    user_id: string;
                    logged_at: string;
                    value: number | null;
                    note: string | null;
                };
                Insert: Omit<Database['public']['Tables']['habit_logs']['Row'], 'id'>;
                Update: Partial<Database['public']['Tables']['habit_logs']['Insert']>;
            };

            workouts: {
                Row: {
                    id: string;
                    user_id: string;
                    name: string;
                    type: WorkoutType;
                    duration_minutes: number | null;
                    calories_burned: number | null;
                    exercises: Json | null;
                    notes: string | null;
                    logged_at: string;
                    source: WorkoutSource;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['workouts']['Row'],
                    'id' | 'source' | 'created_at'
                >;
                Update: Partial<Database['public']['Tables']['workouts']['Insert']>;
            };

            posts: {
                Row: {
                    id: string;
                    user_id: string;
                    content: string | null;
                    media_urls: string[] | null;
                    activity_ref_id: string | null;
                    activity_type: ActivityType | null;
                    likes_count: number;
                    comments_count: number;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['posts']['Row'],
                    'id' | 'likes_count' | 'comments_count' | 'created_at' | 'updated_at'
                >;
                Update: Partial<Database['public']['Tables']['posts']['Insert']>;
            };

            badges: {
                Row: {
                    id: string;
                    slug: string;
                    name: string;
                    description: string | null;
                    icon_url: string | null;
                    xp_reward: number;
                    condition_type: BadgeCondition;
                    condition_value: Json;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['badges']['Row'],
                    'id' | 'created_at'
                >;
                Update: Partial<Database['public']['Tables']['badges']['Insert']>;
            };

            user_badges: {
                Row: {
                    id: string;
                    user_id: string;
                    badge_id: string;
                    awarded_at: string;
                };
                Insert: Omit<Database['public']['Tables']['user_badges']['Row'], 'id' | 'awarded_at'>;
                Update: never;
            };

            // ── B2B ──────────────────────────────────────────────────────────────

            gyms: {
                Row: {
                    id: string;
                    name: string;
                    slug: string;
                    owner_id: string;
                    plan: GymPlan;
                    plan_expires_at: string | null;
                    settings: Json;
                    is_active: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['gyms']['Row'],
                    'id' | 'plan' | 'is_active' | 'created_at' | 'updated_at'
                >;
                Update: Partial<Database['public']['Tables']['gyms']['Insert']>;
            };

            gym_members: {
                Row: {
                    id: string;
                    gym_id: string;
                    user_id: string | null;
                    email: string;
                    full_name: string;
                    phone: string | null;
                    status: MemberStatus;
                    joined_at: string;
                    trainer_id: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['gym_members']['Row'],
                    'id' | 'status' | 'created_at' | 'updated_at'
                >;
                Update: Partial<Database['public']['Tables']['gym_members']['Insert']>;
            };

            memberships: {
                Row: {
                    id: string;
                    gym_id: string;
                    member_id: string;
                    plan_name: string;
                    price: number;
                    currency: string;
                    billing_cycle: BillingCycle;
                    starts_at: string;
                    expires_at: string;
                    status: MembershipStatus;
                    stripe_subscription_id: string | null;
                    mp_subscription_id: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['memberships']['Row'],
                    'id' | 'status' | 'created_at' | 'updated_at'
                >;
                Update: Partial<Database['public']['Tables']['memberships']['Insert']>;
            };

            prospects: {
                Row: {
                    id: string;
                    gym_id: string;
                    full_name: string;
                    email: string | null;
                    phone: string | null;
                    source: ProspectSource;
                    stage: ProspectStage;
                    assigned_to: string | null;
                    notes: string | null;
                    last_contact_at: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['prospects']['Row'],
                    'id' | 'stage' | 'source' | 'created_at' | 'updated_at'
                >;
                Update: Partial<Database['public']['Tables']['prospects']['Insert']>;
            };

            payments: {
                Row: {
                    id: string;
                    gym_id: string;
                    member_id: string;
                    membership_id: string | null;
                    amount: number;
                    currency: string;
                    status: PaymentStatus;
                    provider: PaymentProvider;
                    provider_payment_id: string | null;
                    paid_at: string | null;
                    invoice_url: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['payments']['Row'],
                    'id' | 'status' | 'created_at' | 'updated_at'
                >;
                Update: Partial<Database['public']['Tables']['payments']['Insert']>;
            };

            attendance_logs: {
                Row: {
                    id: string;
                    gym_id: string;
                    member_id: string;
                    checked_in_at: string;
                    checked_out_at: string | null;
                    method: AttendanceMethod;
                    device_id: string | null;
                };
                Insert: Omit<Database['public']['Tables']['attendance_logs']['Row'], 'id'>;
                Update: Partial<Database['public']['Tables']['attendance_logs']['Insert']>;
            };

        };

        Views: Record<string, never>;
        Functions: Record<string, never>;
        Enums: {
            user_plan: UserPlan;
            user_role: UserRole;
            gym_plan: GymPlan;
            member_status: MemberStatus;
            membership_status: MembershipStatus;
            billing_cycle: BillingCycle;
            payment_status: PaymentStatus;
            payment_provider: PaymentProvider;
            prospect_source: ProspectSource;
            prospect_stage: ProspectStage;
            workout_type: WorkoutType;
            workout_source: WorkoutSource;
            activity_type: ActivityType;
            attendance_method: AttendanceMethod;
            badge_condition: BadgeCondition;
            notif_channel: NotifChannel;
        };
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de conveniencia — tipos de Row, Insert y Update por tabla
// ─────────────────────────────────────────────────────────────────────────────
type Tables = Database['public']['Tables'];

export type ProfileRow = Tables['profiles']['Row'];
export type ProfileInsert = Tables['profiles']['Insert'];
export type ProfileUpdate = Tables['profiles']['Update'];

export type HabitRow = Tables['habits']['Row'];
export type HabitInsert = Tables['habits']['Insert'];
export type HabitUpdate = Tables['habits']['Update'];

export type HabitLogRow = Tables['habit_logs']['Row'];
export type HabitLogInsert = Tables['habit_logs']['Insert'];

export type WorkoutRow = Tables['workouts']['Row'];
export type WorkoutInsert = Tables['workouts']['Insert'];
export type WorkoutUpdate = Tables['workouts']['Update'];

export type PostRow = Tables['posts']['Row'];
export type PostInsert = Tables['posts']['Insert'];
export type PostUpdate = Tables['posts']['Update'];

export type BadgeRow = Tables['badges']['Row'];
export type UserBadgeRow = Tables['user_badges']['Row'];

export type GymRow = Tables['gyms']['Row'];
export type GymInsert = Tables['gyms']['Insert'];
export type GymUpdate = Tables['gyms']['Update'];

export type GymMemberRow = Tables['gym_members']['Row'];
export type GymMemberInsert = Tables['gym_members']['Insert'];
export type GymMemberUpdate = Tables['gym_members']['Update'];

export type MembershipRow = Tables['memberships']['Row'];
export type MembershipInsert = Tables['memberships']['Insert'];
export type MembershipUpdate = Tables['memberships']['Update'];

export type ProspectRow = Tables['prospects']['Row'];
export type ProspectInsert = Tables['prospects']['Insert'];
export type ProspectUpdate = Tables['prospects']['Update'];

export type PaymentRow = Tables['payments']['Row'];
export type PaymentInsert = Tables['payments']['Insert'];
export type PaymentUpdate = Tables['payments']['Update'];

export type AttendanceLogRow = Tables['attendance_logs']['Row'];
export type AttendanceLogInsert = Tables['attendance_logs']['Insert'];