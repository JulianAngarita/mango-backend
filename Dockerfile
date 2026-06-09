# ════════════════════════════════════════════════════════════════
# Stage 1 — deps
# Instala solo dependencias de producción.
# Separarlo del build evita reinstalar en cada cambio de código.
# ════════════════════════════════════════════════════════════════
FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production && \
    # Guarda las deps de prod antes de instalar las de dev
    cp -R node_modules /tmp/prod_node_modules

# Instala también devDependencies para poder compilar
RUN npm ci

# ════════════════════════════════════════════════════════════════
# Stage 2 — build
# Compila TypeScript a JavaScript.
# ════════════════════════════════════════════════════════════════
FROM node:20-alpine AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# ════════════════════════════════════════════════════════════════
# Stage 3 — runner
# Imagen final mínima: solo el dist compilado + deps de producción.
# Sin devDependencies, sin código fuente TypeScript.
# ════════════════════════════════════════════════════════════════
FROM node:20-alpine AS runner

# Usuario no-root por seguridad
RUN addgroup -S mango && adduser -S mango -G mango

WORKDIR /app

ENV NODE_ENV=production

COPY --from=deps    /tmp/prod_node_modules ./node_modules
COPY --from=build   /app/dist             ./dist
COPY                package.json          ./

# Render expone el puerto 10000 por defecto; se puede sobrescribir con PORT
EXPOSE 3000

USER mango

CMD ["node", "dist/main"]