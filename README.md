# MarinaGuard — Backend

Sistema de gestión para una guardería náutica: administración de socios, embarcaciones, contratos de guarda, empleados y solicitudes de servicio (combustible, limpieza, mantenimiento, botadura y retiro, carga de baterías, reparaciones).

Backend desarrollado en **NestJS**.

> Trabajo práctico de la materia **Desarrollo de Software** — UTN Facultad Regional Rosario.
> Autor: Giuliano Martín Cappa.

## Tecnologías

- [NestJS](https://nestjs.com/) (Node.js + TypeScript)
- [Prisma ORM](https://www.prisma.io/) sobre PostgreSQL (`@prisma/adapter-pg`)
- Autenticación con JWT (cookie httpOnly) + Passport
- [Resend](https://resend.com/) para el envío de emails transaccionales (recuperación de contraseña, invitación de nuevos usuarios)
- Jest para tests unitarios
- ESLint + Prettier + Husky
- Gestor de paquetes: **pnpm**

## Requisitos previos

- Node.js v24.21.0
- [pnpm](https://pnpm.io/installation)
- Una instancia de PostgreSQL accesible (local o remota, por ejemplo [Neon](https://neon.tech/))

## Instalación

1. Cloná el repositorio y entrá a la carpeta del backend:

   ```bash
   git clone https://github.com/Martiks38/backend_dsw
   cd backend_dsw
   ```

2. Instalá las dependencias:

   ```bash
   pnpm install
   ```

3. Creá un archivo `.env` en la raíz del proyecto, usando como base el siguiente ejemplo:

   ```dotenv
   DATABASE_URL=postgresql://postgres:1234@localhost:5432/guarderia
   FRONTEND_URL=http://localhost:3000
   JWT_EXPIRES_IN=1d
   JWT_SECRET=secret
   RESEND_API_KEY=your-resend-api-key
   ```

   | Variable                  | Descripción                                                                                                                                        |
   | :------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------- |
   | `DATABASE_URL`            | Cadena de conexión principal a la base de datos PostgreSQL.                                                                                        |
   | `DATABASE_URL_POOLED`     | Cadena de conexión con pooling (recomendada para servicios en la nube como Render, Supabase o Neon).                                               |
   | `FRONTEND_URL`            | URL donde corre el frontend. Se usa para armar los links de los emails (recuperación de contraseña, invitaciones) y para la configuración de CORS. |
   | `JWT_EXPIRES_IN`          | Tiempo de expiración del token de sesión (ej. `1d` = 1 día).                                                                                       |
   | `JWT_SECRET`              | Secreto usado para firmar los JWT. **Cambiar por un valor propio y seguro en cualquier entorno que no sea desarrollo local.**                      |
   | `BREVO_API_KEY`           | API key de [Brevo](https://www.brevo.com) para el envío de emails.                                                                                 |
   | `MAIL_FROM_EMAIL`         | Dirección de correo que figurará como remitente en los emails enviados por la plataforma.                                                          |
   | `MAIL_FROM_NAME`          | Nombre que aparecerá como remitente en los emails enviados (ej. `"Guardería Náutica"`).                                                            |
   | `CONTACT_EMAIL_RECIPIENT` | Dirección de correo destinataria para recibir mensajes de contacto y notificaciones internas.                                                      |

4. Generá el cliente de Prisma y aplicá las migraciones:

   ```bash
   pnpm prisma generate
   pnpm prisma migrate dev
   ```

5. (Opcional pero recomendado) Cargá datos de ejemplo — socios, empleados, embarcaciones, contratos y solicitudes de servicio:

   ```bash
   pnpm db:seed
   ```

   Todos los usuarios creados por el seed usan la contraseña `Password123!`.

## Ejecución

```bash
# Modo desarrollo (con recarga automática)
pnpm start:dev

# Modo desarrollo con debugger
pnpm start:debug

# Build de producción
pnpm build
pnpm start:prod
```

Por defecto, la API queda disponible en `http://localhost:3001`. Sin embargo, puede definirse una varible de entorno PORT para definirla `http://localhost:<port>`.

## Tests

```bash
# Tests unitarios
pnpm test

# Tests unitarios en modo watch
pnpm test:watch

# Tests unitarios con reporte de cobertura
pnpm test:cov
```

### Ejecución de tests

![Tests Unitarios e Integración](./docs/images/tests-result.png)

## Calidad de código

```bash
# Linter (con autofix)
pnpm lint

# Formateo con Prettier
pnpm format

# Chequeo de tipos sin emitir archivos
pnpm typecheck
```

El proyecto usa Husky para correr validaciones automáticas antes de cada commit.

## Documentación de la API

Con el servidor corriendo, la documentación interactiva (Swagger) está disponible en: https://backend-dsw-nc3p.onrender.com/api/docs

## Estructura del proyecto

```
src/
  auth/              # Login, JWT strategy, guards, decorators (CurrentUser, Roles)
  users/             # Perfil del usuario autenticado (datos personales, cambio de contraseña)
  clients/           # Alta y gestión de socios (clientes)
  employees/         # Alta y gestión de empleados (operarios y administradores)
  boats/             # Embarcaciones, contratos de guarda, estado (en guardería / en agua / en mantenimiento)
  service-request/   # Solicitudes de servicio: creación, listado, asignación, cambio de estado, cancelación
  dashboard/         # Datos agregados para los paneles de socio, operario y admin
  common/            # Utilidades y servicios compartidos (hash de contraseñas, provisioning de cuentas, etc.)
  mail/              # Envío de emails transaccionales vía Resend
  prisma/            # Cliente y módulo de Prisma
  schema.prisma      # Modelo de datos
  seed.ts            # Script de datos de ejemplo
```

## Roles y funcionalidades principales

El sistema maneja tres roles:

- **Socio (`MEMBER`)**: ve sus embarcaciones y el estado de su guarda, solicita servicios para sus embarcaciones, consulta y cancela sus propias solicitudes pendientes, gestiona su perfil.
- **Operario (`OPERATOR`)**: ve las solicitudes que tiene asignadas, actualiza su estado (en proceso / completada), registra la salida y el regreso de embarcaciones para servicios de botadura y retiro.
- **Administrador (`ADMIN`)**: gestiona socios, empleados y embarcaciones (incluyendo el contrato de guarda), asigna operarios a las solicitudes, hace seguimiento de todos los servicios en curso.

## Modelo de Datos (Diagrama Entidad-Relación)

A continuación se visualiza el diagrama ER de la base de datos generado con prisma-erd-generator:

![Diagrama ER de la Guardería Náutica](./docs/images/er-diagram.png)

## Despliegue

- **API en producción:** https://backend-dsw-nc3p.onrender.com
- **Credenciales de prueba:**
  - Email: `valentina.suarez@nautico.com.ar`
  - Password: `Password123!`

## Documentación adicional y propuesta del TP

La propuesta del trabajo práctico, con las condiciones de regularidad y aprobación, se encuentra en el repositorio del TP: [proposal.md](https://github.com/Martiks38/tp_desarrollo_software/blob/main/proposal.md).
