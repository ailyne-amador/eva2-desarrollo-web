# AGENTS.md — Contexto del proyecto

## Qué es
Gestor de proyectos de marketing: app web MVC en Node.js + TypeScript + Express, vistas Handlebars con Bootstrap. Usuarios se registran y publican/editan/eliminan sus propios proyectos; la lectura es pública. Solo el creador (`created_by`) modifica su proyecto.

Modelos: Usuario (id, nombre, apellido, correo único, password hasheada con Argon2), Proyecto (id, nombre, descripcion, fechaInicio, estado, monto en CLP entero, created_by).

## Estado actual
Persistencia: **Prisma ORM 7 + PostgreSQL en Supabase** (`DATABASE_URL` local apunta a la conexión Session Pooler, vía `@prisma/adapter-pg`). Cliente singleton en `src/models/db.ts` (`export const prisma`); cliente generado en `src/generated/prisma` (gitignored, regenerar con `npx prisma generate`). **Auth implementada**: registro/login/logout con Argon2 + JWT en cookie httpOnly SameSite=Lax (`src/auth.ts`: `loadUser` deja el usuario en `res.locals.usuario`, `requireAuthView` redirige a /login, `requireAuthApi` da 401). **CRUD de proyectos** en vistas y API: lectura pública, creación autenticada, edición/eliminación solo del creador (403 si no).

## Decisiones técnicas (respetar)
- **Node 24 ejecuta TypeScript nativamente** (type stripping). No hay tsx/ts-node ni paso de build. Consecuencias:
  - Imports entre archivos llevan extensión `.ts` explícita (`import { x } from "./routes/api.ts"`).
  - No usar enums ni namespaces de TS (type stripping no los soporta).
  - `"type": "module"` en package.json: ESM, nada de `require`.
- **TypeScript solo como typechecker (sujeto a cambio cuando el proyecto crezca)**: `npm run typecheck` (`tsc --noEmit`).
- **Express 5** + **express-handlebars**. Vistas en `src/views`, layout `layouts/main.handlebars`.
- **Bootstrap por CDN** en el layout. No hay assets propios ni pipeline de frontend.
- **Prisma ORM 7 + PostgreSQL en Supabase**:
  - Requiere el driver adapter `@prisma/adapter-pg`, export `PrismaPg`.
  - Generador `prisma-client` (TS plano) con output en `src/generated/prisma`; se importa desde `src/models/db.ts`.
  - `prisma.config.ts` obligatorio; carga `.env` con `config({ override: true })`.
  - `npx prisma migrate deploy` aplica las migraciones versionadas en Supabase.
  - `npx prisma generate` regenera el cliente después de cambiar el esquema.
  - `DATABASE_URL` debe ser una URI PostgreSQL de Supabase; para desarrollo local se usa Session Pooler en modo sesión.
- **tsconfig**: `"types": ["node"]` explícito e `include: ["src", "prisma.config.ts"]` (sin esto, el editor no resuelve `process` en el config de Prisma).
- **npm**: política allowScripts activa; los install scripts de `argon2`, `prisma` y `@prisma/engines` están aprobados.

## Estructura (MVC)
```
src/app.ts            # bootstrap: handlebars engine (+helpers eq/fecha/clp), parsers, cookie-parser, loadUser, routers, PORT (default 3000)
src/auth.ts           # argon2 hash/verify, cookie JWT, loadUser, requireAuthView/requireAuthApi (middleware)
src/validar.ts        # validación de proyecto (compartida vistas/API); monto = CLP entero
src/models/db.ts      # singleton PrismaClient (adapter PrismaPg, lee DATABASE_URL de .env) — capa de modelo
src/controllers/      # handlers de VISTAS: homeController, authController, proyectoController
src/controllers/api/  # handlers de API JSON: authController, proyectoController
src/routes/index.ts   # viewRoutes — solo cablea rutas de VISTAS a controllers, en root
src/routes/api.ts     # apiRoutes — cablea rutas de API a controllers (/api/auth/*, /api/proyectos/*); /health va inline
src/views/            # layouts/main.handlebars (estilos inline), home, registro, login, proyectos/{lista,form}
prisma/schema.prisma  # modelos Usuario/Proyecto
prisma.config.ts      # v7: datasource PostgreSQL + dotenv; DATABASE_URL apunta a Supabase
```

## Migración completada
- Se reemplazó SQLite por PostgreSQL en Supabase.
- Se creó la migración base `prisma/migrations/20260824120000_postgresql_init` y se retiraron las migraciones SQLite anteriores.
- Se migraron los datos existentes de `dev.db`: 2 usuarios y 2 proyectos, conservando IDs, relaciones y secuencias.
- `dev.db` queda como respaldo local; la aplicación ya no lo utiliza.

## Convención MVC (acordada con el usuario)
- **Rutas delgadas**: los routers solo declaran ruta → middleware → controller; la lógica vive en `src/controllers`.
- Vistas → root, en `src/routes/index.ts` (export `viewRoutes`) con controllers en `src/controllers/`.
- API → detrás de `/api`, en `src/routes/api.ts` (export `apiRoutes`) con controllers en `src/controllers/api/`.
- Montaje en `app.ts`: `app.use(viewRoutes); app.use("/api", apiRoutes)`.
- Nuevas rutas van en el archivo que corresponda; no mezclar. Lógica nueva → controller correspondiente, no en el router.
- Modelo: `prisma/schema.prisma` define Usuario/Proyecto; acceso siempre vía `src/models/db.ts`.

## Comandos
- `npm run dev` — `node --watch src/app.ts` (auto-reload en cambios de código).
- `npm start` — `node src/app.ts` (sin watch: requiere reinicio ante cambios de código).
- `npm run typecheck` — verificar tipos; debe quedar limpio tras cada cambio.
- `npx prisma migrate deploy` — aplicar las migraciones PostgreSQL versionadas en Supabase.
- Tras modificar `prisma/schema.prisma`, crear una nueva migración PostgreSQL y ejecutar `npx prisma migrate deploy`; no reutilizar SQL de las migraciones SQLite.
- `npx prisma generate` — regenerar el cliente en `src/generated/prisma` (necesario tras cambios de esquema).

## Notas operativas
- Puerto: `process.env.PORT` o 3000.
- `.env` requiere `DATABASE_URL` con una URI PostgreSQL de Supabase y `JWT_SECRET` (auth.ts falla al arrancar sin él). No versionar `.env` ni sus credenciales.
- La aplicación local necesita conexión a Internet para acceder a Supabase.
- Las vistas Handlebars se re-renderizan por petición fuera de producción (NODE_ENV sin definir) → cambios en `.handlebars` no requieren reinicio; cambios en `.ts` sí (salvo con `--watch`).
- Verificación habitual tras cambios: `npm run typecheck` + levantar server + `curl /`, `curl /api/health` y, si se modifica persistencia, `curl /api/proyectos`.

## Flujo de trabajo con el usuario
- Responder en español.

## Pendiente
- Brief base completo. Posibles mejoras futuras: paginación del listado, refresh tokens, deploy.
