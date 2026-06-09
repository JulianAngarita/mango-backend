import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { TerminusModule } from '@nestjs/terminus';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { APP_GUARD } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { createClient } from 'ioredis';

import { appConfig } from './config/app.config';
import { supabaseConfig } from './config/supabase.config';
import { redisConfig } from './config/redis.config';
import { stripeConfig } from './config/stripe.config';

// ── Supabase ────────────────────────────────────────────────────────────────
import { SupabaseModule } from './supabase/supabase.module';

// ── Infraestructura ─────────────────────────────────────────────────────────
import { QueueModule } from './infrastructure/queue/queue.module';

// ── B2C — Módulos de usuario ────────────────────────────────────────────────
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { GoalsModule } from './modules/goals/goals.module';
import { HabitsModule } from './modules/habits/habits.module';
import { TrackingModule } from './modules/tracking/tracking.module';
import { WorkoutsModule } from './modules/workouts/workouts.module';
import { ProgressModule } from './modules/progress/progress.module';
import { FeedModule } from './modules/feed/feed.module';
import { SocialModule } from './modules/social/social.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { ChallengesModule } from './modules/challenges/challenges.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SearchModule } from './modules/search/search.module';
import { AiModule } from './modules/ai/ai.module';
import { WearablesModule } from './modules/wearables/wearables.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';

// ── B2B — Módulos CRM ───────────────────────────────────────────────────────
import { GymsModule } from './modules/gyms/gyms.module';
import { GymMembersModule } from './modules/gym-members/gym-members.module';
import { MembershipsModule } from './modules/memberships/memberships.module';
import { ProspectsModule } from './modules/prospects/prospects.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { TrainersModule } from './modules/trainers/trainers.module';
import { CommunicationsModule } from './modules/communications/communications.module';
import { SegmentsModule } from './modules/segments/segments.module';
import { CrmAnalyticsModule } from './modules/crm-analytics/crm-analytics.module';
import { ReportsModule } from './modules/reports/reports.module';

@Module({
  imports: [

    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, supabaseConfig, redisConfig, stripeConfig],
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          level: config.get('app.nodeEnv') === 'production' ? 'info' : 'debug',
          transport:
            config.get('app.nodeEnv') !== 'production'
              ? { target: 'pino-pretty', options: { singleLine: true } }
              : undefined,
          serializers: {
            req(req) {
              return { method: req.method, url: req.url, id: req.id };
            },
          },
        },
      }),
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 100,
      },
      {
        name: 'auth',
        ttl: 60_000,
        limit: 10,
      },
    ]),
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        store: 'ioredis',
        redisInstance: createClient(config.get<string>('redis.url')!),
        ttl: 300,
      }),
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      sortSchema: true,
      playground: process.env.NODE_ENV !== 'production',
      context: ({ req, res }) => ({ req, res }),
    }),
    TerminusModule,
    SupabaseModule,
    QueueModule,

    // ── B2C ─────────────────────────────────────────────────────────────────
    AuthModule,
    UsersModule,
    OnboardingModule,
    GoalsModule,
    HabitsModule,
    TrackingModule,
    WorkoutsModule,
    ProgressModule,
    FeedModule,
    SocialModule,
    GamificationModule,
    ChallengesModule,
    NotificationsModule,
    SearchModule,
    AiModule,
    WearablesModule,
    SubscriptionsModule,

    // ── B2B ─────────────────────────────────────────────────────────────────
    GymsModule,
    GymMembersModule,
    MembershipsModule,
    ProspectsModule,
    AttendanceModule,
    PaymentsModule,
    TrainersModule,
    CommunicationsModule,
    SegmentsModule,
    CrmAnalyticsModule,
    ReportsModule,
  ],

  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}