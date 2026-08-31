# ============================================================
# Guía de Inicio — Registro MRI v2.0
# FEMSA Salud CSIRT
# ============================================================

## PASO 1 — Instalar Docker Desktop
1. Descarga Docker Desktop desde: https://www.docker.com/products/docker-desktop/
2. Ejecuta el instalador (Docker Desktop Installer.exe)
3. Acepta las opciones por defecto
4. Al finalizar, **REINICIA el computador**
5. Abre Docker Desktop desde el escritorio y espera que aparezca:
   ✅ "Docker Desktop is running" (ícono de ballena en la barra de tareas)

## PASO 2 — Verificar Docker
Abre PowerShell y ejecuta:
```
docker --version
docker compose version
```
Debe mostrar algo como:
  Docker version 27.x.x
  Docker Compose version v2.x.x

## PASO 3 — Levantar la Aplicación
En PowerShell, navega al proyecto y ejecuta:
```powershell
cd "c:\Users\walter.reyes\OneDrive - Femsa Salud\Escritorio\RegistroMRI"
docker compose up -d
```
Primera vez tarda ~5-10 min (descarga imágenes de PostgreSQL, Redis, Node.js)

## PASO 4 — Verificar que todo esté corriendo
```powershell
docker compose ps
```
Deben aparecer 4 servicios con estado "healthy" o "running":
  - mri-postgres   ✅ healthy
  - mri-redis      ✅ healthy  
  - mri-backend    ✅ running
  - mri-frontend   ✅ running

## PASO 5 — Crear el primer usuario Administrador
```powershell
docker compose exec backend npx ts-node src/seed-admin.ts
```
Te pedirá:
  - Usuario   → ej: admin
  - Email     → ej: w.reyes@femsasalud.com
  - Nombre    → Walter
  - Apellido  → Reyes
  - Cargo     → Líder CSIRT
  - Contraseña (mínimo: 8 caracteres, mayúscula, número, símbolo)

## PASO 6 — Acceder a la Aplicación
- Frontend:    http://localhost:4200
- API Docs:    http://localhost:3000/api/docs
- pgAdmin:     docker compose --profile tools up -d  →  http://localhost:5050

## COMANDOS ÚTILES
```powershell
# Ver logs en tiempo real
docker compose logs -f

# Ver logs solo del backend
docker compose logs -f backend

# Detener todo
docker compose down

# Detener y eliminar datos (CUIDADO: borra la DB)
docker compose down -v

# Reiniciar solo el backend
docker compose restart backend
```
