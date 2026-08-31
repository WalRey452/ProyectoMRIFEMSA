# ============================================================
# Dockerfile — Backend NestJS
# Multi-stage build para producción optimizada
# FEMSA Salud CSIRT — Registro MRI
# ============================================================

# ─── Stage 1: Build ────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar manifiestos de dependencias
COPY package*.json ./
COPY tsconfig*.json ./

# Instalar TODAS las dependencias (incluye devDependencies para el build)
RUN npm ci

# Copiar código fuente
COPY src/ ./src/

# Compilar TypeScript a JavaScript
RUN npm run build

# Limpiar devDependencies para imagen más pequeña
RUN npm ci --only=production && npm cache clean --force

# ─── Stage 2: Production Runtime ───────────────────────────
FROM node:20-alpine AS production

# Metadata de la imagen
LABEL maintainer="FEMSA Salud CSIRT <csirt@femsasalud.com>"
LABEL version="2.0.0"
LABEL description="Registro MRI Backend API — FEMSA Salud"

# Variables de entorno para Node.js en producción
ENV NODE_ENV=production
ENV PORT=3000

# Crear usuario no-root por seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

WORKDIR /app

# Copiar artefactos del build
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./

# Crear directorio de uploads con permisos correctos
RUN mkdir -p /app/uploads && chown -R nestjs:nodejs /app/uploads

# Cambiar al usuario no-root
USER nestjs

# Puerto expuesto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health || exit 1

# Comando de inicio
CMD ["node", "dist/main"]
