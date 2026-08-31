# ============================================================
# Dockerfile — Frontend Angular 18
# Multi-stage: Angular build + Nginx production serve
# FEMSA Salud CSIRT — Registro MRI
# ============================================================

# ─── Stage 1: Build Angular ────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build:prod

# ─── Stage 2: Nginx Production Server ──────────────────────
FROM nginx:1.25-alpine AS production

LABEL maintainer="FEMSA Salud CSIRT <csirt@femsasalud.com>"
LABEL version="2.0.0"
LABEL description="Registro MRI Frontend — FEMSA Salud"

# Copiar configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copiar artefactos del build de Angular
COPY --from=builder /app/dist/registro-mri/browser /usr/share/nginx/html

# Permisos seguros
RUN chmod -R 755 /usr/share/nginx/html && \
    chown -R nginx:nginx /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
