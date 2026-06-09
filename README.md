# Mango Backend — v2 (Supabase + Render)

## Stack
| Capa | Tecnología |
|---|---|
| API | NestJS + TypeScript |
| Auth | Supabase Auth (JWT, Google, Apple) |
| Base de datos | Supabase PostgreSQL |
| Realtime | Supabase Realtime (cliente directo) |
| Storage | Supabase Storage |
| Caché / Colas | Upstash Redis + BullMQ |
| Pagos | Stripe + MercadoPago |
| Push | Firebase FCM |
| Email | SendGrid |
| SMS / WhatsApp | Twilio |
| IA | FastAPI (Python) en Render |
| Deploy | Render (API + IA como servicios separados) |

## Decisiones clave

### ¿Por qué Supabase Auth y no Passport.js?
Supabase Auth gestiona el ciclo completo: registro, login, OAuth, refresh tokens y
revocación. El backend solo verifica el JWT en cada request con `supabase-auth.guard.ts`.

### ¿Por qué Upstash Redis y no Redis propio?
Upstash es Redis serverless compatible con BullMQ. En Render no hay servicio Redis nativo
administrado; Upstash se conecta vía URL sin gestionar instancias.

### ¿Por qué no WebSocket gateway en NestJS?
El feed en tiempo real y las notificaciones in-app usan Supabase Realtime directamente
desde el cliente móvil/web. Elimina un punto de fallo y reduce la carga del backend.

### ¿Por qué Supabase Edge Functions para algunos triggers?
Para lógica que debe ejecutarse inmediatamente después de un evento de base de datos
(nuevo usuario registrado → crear perfil, hábito registrado → evaluar gamificación)
las Edge Functions corren en el mismo edge que la DB, con latencia mínima.

## Estructura de capas
route → controller → service → repository → supabase client

## Comandos
\`\`\`bash
npm install
supabase start          # levanta Supabase local
npm run start:dev       # NestJS en watch mode
supabase db push        # aplica migraciones
\`\`\`
# mango-backend
