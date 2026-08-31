# Registro MRI - FEMSA Salud CSIRT

## Descripción
Esta aplicación es el **Registro de Gestión de Incidentes y Eventos (Registro MRI)**, diseñada específicamente para el equipo de CSIRT de FEMSA Salud. Permite llevar un control centralizado y profesional de:
- Incidentes de Ciberseguridad.
- Eventos de Seguridad.
- Playbooks (Flujos de respuesta a incidentes).
- Escalamientos y contactos clave.
- Auditoría general y reportes.

La plataforma está dividida en un Backend robusto desarrollado en **NestJS** (con conexión a base de datos PostgreSQL) y un Frontend dinámico desarrollado en **Angular 18**.

## Estructura del Proyecto
- `/backend`: Contiene la API RESTful (NestJS). Se encarga de la lógica de negocio, autenticación, autorización y persistencia de datos.
- `/frontend`: Contiene la interfaz de usuario (Angular).

## Cómo Levantar el Entorno (Sin Docker)
Para arrancar el proyecto en un entorno local utilizando Node Portable:

1. **Backend**:
   - Abre una terminal en la carpeta `/backend`.
   - Ejecuta: `npm run start:dev`
   - El backend se ejecutará en `http://localhost:3000`.

2. **Frontend**:
   - Abre una terminal en la carpeta `/frontend`.
   - Ejecuta: `npm start`
   - El frontend estará disponible en `http://localhost:4200`.

*Nota: Asegúrate de tener configurada la variable de entorno PATH para utilizar la versión de node-portable incluida en el proyecto.*

## Roles y Accesos
El sistema cuenta con un control de acceso basado en roles (RBAC). 
- **MRI** (Anteriormente Administrador): Control total del sistema.
- **Analista**: Puede registrar y gestionar eventos e incidentes, pero con restricciones en la administración de usuarios.
- **Solo Lectura**: Acceso exclusivo para visualización y generación de reportes (ej. dashboards), sin permisos de edición o borrado.
