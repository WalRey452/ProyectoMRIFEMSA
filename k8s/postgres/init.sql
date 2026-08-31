-- ============================================================
-- Registro MRI — PostgreSQL Database Init Script
-- FEMSA Salud CSIRT
-- Se ejecuta automáticamente cuando el contenedor se crea por primera vez
-- ============================================================

-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Para búsqueda de texto
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ─── Comentar la base de datos ────────────────────────────
COMMENT ON DATABASE registro_mri IS 'Registro de Monitoreo y Respuesta a Incidentes — FEMSA Salud CSIRT';

-- ─── Tipos ENUM ───────────────────────────────────────────
-- Nota: TypeORM sincronizará automáticamente la mayoría de los tipos.
-- Estos son para referencia y uso manual en queries.

-- Ejecutar como verificación de salud
SELECT 'Base de datos registro_mri inicializada correctamente.' as status;
